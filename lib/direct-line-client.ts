import { activityText, classifyBotActivity, extractSources, isCorrelatedActivity, mergeSources } from "./direct-line-classifier.js";

export type SourceDocument = { title: string; url: string; downloadUrl: string; fileType: string };
type Activity = Record<string, any>;
type ActivitySet = { activities?: Activity[]; watermark?: string };
type Conversation = { conversationId: string; token: string; expiresIn: number; streamUrl?: string; userId: string; directLineBaseUrl: string };
export type AnswerResult = { text: string; sources: SourceDocument[] };
export type SendCallbacks = { onStatus?: (status: string) => void; onSource?: (sources: SourceDocument[]) => void };

type PendingRequest = {
  activityId?: string;
  sentAt: number;
  userId: string;
  answers: string[];
  sources: SourceDocument[];
  callbacks: SendCallbacks;
  resolve: (value: AnswerResult) => void;
  reject: (reason: Error) => void;
  settleTimer?: ReturnType<typeof setTimeout>;
  timeoutTimer?: ReturnType<typeof setTimeout>;
};

const DEFAULT_TIMEOUT = 180_000;
const SETTLE_AFTER_FINAL_MS = 4_000;
const POLL_INTERVAL_MS = 1_400;

export class DirectLineClient {
  private conversation?: Conversation;
  private socket?: WebSocket;
  private watermark?: string;
  private seenActivityIds = new Set<string>();
  private pending?: PendingRequest;
  private pollTimer?: ReturnType<typeof setTimeout>;
  private refreshTimer?: ReturnType<typeof setTimeout>;
  private websocketFallbackTimer?: ReturnType<typeof setTimeout>;
  private stopped = false;
  private consecutivePollFailures = 0;

  constructor(private readonly userName: string) {}

  async sendMessage(text: string, callbacks: SendCallbacks = {}): Promise<AnswerResult> {
    if (!text.trim()) throw new Error("Enter a question before sending.");
    if (this.pending) throw new Error("Ask Revant Bot is still answering the previous question.");
    await this.ensureConversation();
    await this.drainStaleActivities();
    const conversation = this.conversation!;

    return new Promise<AnswerResult>(async (resolve, reject) => {
      const timeoutMs = Number(process.env.NEXT_PUBLIC_DIRECT_LINE_TIMEOUT_MS) || DEFAULT_TIMEOUT;
      const request: PendingRequest = {
        sentAt: Date.now(), userId: conversation.userId, answers: [], sources: [], callbacks, resolve, reject
      };
      this.pending = request;
      callbacks.onStatus?.("Ask Revant Bot is working on your answer.");
      request.timeoutTimer = setTimeout(() => {
        if (this.pending !== request) return;
        this.finishWithError(new Error("Copilot Studio did not return a final answer within three minutes. Please try again."));
      }, Math.max(30_000, timeoutMs));

      try {
        const response = await fetch(this.activitiesUrl(), {
          method: "POST",
          headers: this.authHeaders(),
          body: JSON.stringify({
            type: "message",
            from: { id: conversation.userId, name: this.userName },
            text: text.trim(),
            locale: navigator.language || "en-US",
            channelData: { client: "ask-revantage", version: "4.0.0" }
          })
        });
        if (!response.ok) throw new Error(await this.describeResponseError(response, "Copilot Studio could not accept the question."));
        const acknowledgment = await response.json();
        request.activityId = acknowledgment.id;
        // The POST response is only an acknowledgment. Completion occurs in processActivitySet.
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) this.startPolling();
      } catch (error) {
        this.finishWithError(error instanceof Error ? error : new Error("The question could not be sent."));
      }
    });
  }

  cancelPending() {
    if (this.pending) this.finishWithError(new Error("The request was cancelled."));
  }

  dispose() {
    this.stopped = true;
    this.cancelPending();
    this.stopPolling();
    clearTimeout(this.refreshTimer);
    clearTimeout(this.websocketFallbackTimer);
    if (this.socket) {
      this.socket.onclose = null;
      this.socket.close();
    }
  }

  private async ensureConversation() {
    if (this.conversation) return;
    const response = await fetch("/api/directline/start", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: this.userName })
    });
    if (!response.ok) throw new Error(await this.describeResponseError(response, "Copilot Studio is not available."));
    this.conversation = await response.json();
    this.openWebSocket(this.conversation!.streamUrl);
    this.scheduleRefresh(this.conversation!.expiresIn);
  }

  private openWebSocket(streamUrl?: string) {
    if (!streamUrl || this.stopped) return this.startPolling();
    try {
      const socket = new WebSocket(streamUrl);
      this.socket = socket;
      socket.onopen = () => {
        this.stopPolling();
        clearTimeout(this.websocketFallbackTimer);
      };
      socket.onmessage = event => {
        if (!event.data) return; // Direct Line sends empty keep-alive frames.
        try { this.processActivitySet(JSON.parse(event.data)); } catch (error) { console.warn("Ignored malformed Direct Line stream frame", error); }
      };
      socket.onerror = () => { if (this.pending) this.startPolling(); };
      socket.onclose = () => {
        if (!this.stopped) this.startPolling();
      };
      this.websocketFallbackTimer = setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) this.startPolling();
      }, 5_000);
    } catch {
      this.startPolling();
    }
  }

  private startPolling() {
    if (this.pollTimer || this.stopped || !this.conversation) return;
    const poll = async () => {
      this.pollTimer = undefined;
      if (this.stopped || !this.conversation) return;
      try {
        const response = await fetch(this.activitiesUrl(true), { headers: this.authHeaders(), cache: "no-store" });
        if (response.status === 401 || response.status === 403) await this.refreshToken();
        else if (!response.ok) throw new Error(`Activities request failed (${response.status}).`);
        else {
          this.consecutivePollFailures = 0;
          this.processActivitySet(await response.json());
        }
      } catch (error) {
        this.consecutivePollFailures += 1;
        console.warn("Direct Line polling retry", error);
        if (this.consecutivePollFailures >= 8 && this.pending) {
          this.finishWithError(new Error("The connection to Copilot Studio was interrupted. Please try again."));
          return;
        }
      }
      if (!this.stopped && (!this.socket || this.socket.readyState !== WebSocket.OPEN)) {
        this.pollTimer = setTimeout(poll, POLL_INTERVAL_MS * Math.min(4, Math.max(1, this.consecutivePollFailures)));
      }
    };
    this.pollTimer = setTimeout(poll, 0);
  }

  private stopPolling() {
    clearTimeout(this.pollTimer);
    this.pollTimer = undefined;
    this.consecutivePollFailures = 0;
  }

  private processActivitySet(set: ActivitySet) {
    if (set.watermark !== undefined && set.watermark !== null) this.watermark = String(set.watermark);
    for (const activity of set.activities || []) {
      const dedupeId = activity.id || `${activity.timestamp || ""}|${activity.type || ""}|${activityText(activity)}`;
      if (this.seenActivityIds.has(dedupeId)) continue;
      this.seenActivityIds.add(dedupeId);
      if (this.seenActivityIds.size > 1_000) this.seenActivityIds = new Set(Array.from(this.seenActivityIds).slice(-500));
      this.processPendingActivity(activity);
    }
  }

  private processPendingActivity(activity: Activity) {
    const request = this.pending;
    if (!request || !isCorrelatedActivity(activity, request)) return;
    const sources = extractSources(activity) as SourceDocument[];
    if (sources.length) {
      request.sources = mergeSources(request.sources, sources) as SourceDocument[];
      request.callbacks.onSource?.(request.sources);
    }
    const classification = classifyBotActivity(activity);
    if (classification.kind === "progress") {
      request.callbacks.onStatus?.(classification.text || "Ask Revant Bot is checking the knowledge base.");
      return;
    }
    if (classification.kind === "metadata") {
      if (request.answers.length) this.scheduleCompletion(request);
      return;
    }
    if (classification.kind === "terminal") {
      if (request.answers.length) this.complete(request);
      else this.finishWithError(new Error(classification.text || "Copilot Studio ended the conversation before returning an answer."));
      return;
    }
    if (classification.kind === "final") {
      const text = String(classification.text || "").trim();
      if (text && !request.answers.includes(text)) request.answers.push(text);
      request.callbacks.onStatus?.("Finalizing the answer and supporting sources…");
      this.scheduleCompletion(request);
    }
  }

  private scheduleCompletion(request: PendingRequest) {
    clearTimeout(request.settleTimer);
    request.settleTimer = setTimeout(() => {
      if (this.pending === request && request.answers.length) this.complete(request);
    }, SETTLE_AFTER_FINAL_MS);
  }

  private complete(request: PendingRequest) {
    if (this.pending !== request) return;
    this.clearRequestTimers(request);
    this.pending = undefined;
    request.resolve({ text: request.answers.join("\n\n"), sources: request.sources });
  }

  private finishWithError(error: Error) {
    const request = this.pending;
    if (!request) return;
    this.clearRequestTimers(request);
    this.pending = undefined;
    request.reject(error);
  }

  private clearRequestTimers(request: PendingRequest) {
    clearTimeout(request.timeoutTimer);
    clearTimeout(request.settleTimer);
  }

  private async drainStaleActivities() {
    if (!this.conversation) return;
    try {
      const response = await fetch(this.activitiesUrl(true), { headers: this.authHeaders(), cache: "no-store" });
      if (response.ok) this.processActivitySet(await response.json());
    } catch { /* WebSocket or later polling still covers the active request. */ }
  }

  private scheduleRefresh(expiresIn = 1800) {
    clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(() => void this.refreshToken(), Math.max(60_000, (expiresIn - 300) * 1000));
  }

  private async refreshToken() {
    if (!this.conversation) return;
    const response = await fetch("/api/directline/refresh", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: this.conversation.token })
    });
    if (!response.ok) throw new Error("The Copilot Studio session expired.");
    const refreshed = await response.json();
    this.conversation.token = refreshed.token;
    this.scheduleRefresh(refreshed.expiresIn);
  }

  private activitiesUrl(includeWatermark = false) {
    const conversation = this.conversation!;
    const base = `${conversation.directLineBaseUrl}/v3/directline/conversations/${encodeURIComponent(conversation.conversationId)}/activities`;
    return includeWatermark && this.watermark !== undefined ? `${base}?watermark=${encodeURIComponent(this.watermark)}` : base;
  }

  private authHeaders() {
    return { Authorization: `Bearer ${this.conversation!.token}`, "Content-Type": "application/json" };
  }

  private async describeResponseError(response: Response, fallback: string) {
    try { return (await response.json())?.error || fallback; } catch { return fallback; }
  }
}
