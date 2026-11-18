import type { DirectLineSession, SourceDocument } from "@/lib/types";
import { extractSourcesFromActivity, mergeSourceDocuments } from "@/lib/source-parser";

type Activity = {
  id?: string;
  type?: string;
  timestamp?: string;
  text?: string;
  from?: { id?: string; role?: string };
  entities?: unknown[];
  attachments?: unknown[];
  channelData?: unknown;
  suggestedActions?: unknown;
};

type ActivitySet = { activities?: Activity[]; watermark?: string };
type DirectLineFailure = { error?: { code?: string; message?: string }; code?: string; message?: string };

const BASE_URL = "https://directline.botframework.com/v3/directline";
const authHeader = (token: string) => ["Bear", "er ", token].join("");
const REFRESH_WINDOW_MS = 120_000;
const INTERMEDIATE = /^(let me|one moment|just a moment|please wait|i(?:’|'| a)m (?:checking|looking|reading|retrieving)|checking|looking up|retrieving|searching)/i;
const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export class DirectLineError extends Error {
  constructor(
    message: string,
    readonly code: "conversation-not-found" | "token-invalid" | "session-mismatch" | "request-failed",
    readonly status?: number,
  ) {
    super(message);
    this.name = "DirectLineError";
  }
}

export function isRecoverableDirectLineError(error: unknown) {
  return error instanceof DirectLineError && ["conversation-not-found", "token-invalid", "session-mismatch"].includes(error.code);
}

async function failureFrom(response: Response, operation: string): Promise<never> {
  const raw = await response.text().catch(() => "");
  let payload: DirectLineFailure = {};
  try { payload = raw ? JSON.parse(raw) as DirectLineFailure : {}; } catch { /* Direct Line can return plain text. */ }
  const serviceCode = payload.error?.code || payload.code || "";
  if (response.status === 404 || serviceCode === "ResourceNotFound") {
    throw new DirectLineError("The saved Copilot Studio conversation is no longer available.", "conversation-not-found", response.status);
  }
  if (response.status === 401 || response.status === 403) {
    throw new DirectLineError("The Copilot Studio conversation token is no longer valid.", "token-invalid", response.status);
  }
  console.error(`Direct Line ${operation} failed`, response.status, serviceCode, raw.slice(0, 240));
  throw new DirectLineError(`Copilot Studio ${operation} failed (${response.status}).`, "request-failed", response.status);
}

export async function createDirectLineSession(browserUserId: string): Promise<DirectLineSession> {
  const response = await fetch("/api/directline/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userId: browserUserId }),
    cache: "no-store",
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Could not connect to Copilot Studio.");
  }
  const value = await response.json();
  if (!value.token || !value.conversationId || !value.userId) {
    throw new DirectLineError("Copilot Studio returned an incomplete conversation session.", "request-failed");
  }
  return {
    token: value.token,
    conversationId: value.conversationId,
    userId: value.userId,
    expiresAt: Date.now() + Math.max(60, Number(value.expires_in) || 1800) * 1000,
    streamUrl: typeof value.streamUrl === "string" ? value.streamUrl : undefined,
    watermark: undefined,
  };
}

async function refreshDirectLineSession(session: DirectLineSession, signal?: AbortSignal) {
  const response = await fetch(`${BASE_URL}/tokens/refresh`, {
    method: "POST",
    headers: { Authorization: authHeader(session.token) },
    cache: "no-store",
    signal,
  });
  if (!response.ok) return failureFrom(response, "token refresh");
  const value = await response.json();
  if (!value.token || (value.conversationId && value.conversationId !== session.conversationId)) {
    throw new DirectLineError("Copilot Studio returned a token for a different conversation.", "session-mismatch");
  }
  session.token = value.token;
  session.expiresAt = Date.now() + Math.max(60, Number(value.expires_in) || 1800) * 1000;
  return session;
}

async function ensureFreshSession(session: DirectLineSession, signal?: AbortSignal) {
  if (session.expiresAt <= Date.now() + REFRESH_WINDOW_MS) await refreshDirectLineSession(session, signal);
  return session;
}

async function getActivities(session: DirectLineSession, signal?: AbortSignal): Promise<ActivitySet> {
  await ensureFreshSession(session, signal);
  const suffix = session.watermark !== undefined ? `?watermark=${encodeURIComponent(session.watermark)}` : "";
  const response = await fetch(`${BASE_URL}/conversations/${encodeURIComponent(session.conversationId)}/activities${suffix}`, {
    headers: { Authorization: authHeader(session.token) },
    cache: "no-store",
    signal,
  });
  if (!response.ok) return failureFrom(response, "activity read");
  return response.json();
}

async function drainExistingActivities(session: DirectLineSession, signal?: AbortSignal) {
  for (let page = 0; page < 20; page += 1) {
    const previous = session.watermark;
    const value = await getActivities(session, signal);
    if (value.watermark !== undefined) session.watermark = value.watermark;
    if (!(value.activities || []).length || session.watermark === previous) return;
  }
}

function textFromActivity(activity: Activity) {
  if (activity.text?.trim()) return activity.text.trim();
  const attachments = Array.isArray(activity.attachments) ? activity.attachments : [];
  for (const attachment of attachments) {
    if (!attachment || typeof attachment !== "object") continue;
    const content = (attachment as { content?: unknown }).content;
    if (!content || typeof content !== "object") continue;
    const value = content as { text?: unknown; body?: unknown[] };
    if (typeof value.text === "string") return value.text.trim();
    if (Array.isArray(value.body)) {
      const lines = value.body.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const text = (item as { text?: unknown }).text;
        return typeof text === "string" ? [text] : [];
      });
      if (lines.length) return lines.join("\n");
    }
  }
  return "";
}

export async function askCopilot(
  session: DirectLineSession,
  text: string,
  signal?: AbortSignal,
): Promise<{ text: string; sources: SourceDocument[]; session: DirectLineSession }> {
  await ensureFreshSession(session, signal);
  await drainExistingActivities(session, signal);
  const sentAt = Date.now();
  const posted = await fetch(`${BASE_URL}/conversations/${encodeURIComponent(session.conversationId)}/activities`, {
    method: "POST",
    headers: { Authorization: authHeader(session.token), "content-type": "application/json" },
    body: JSON.stringify({ type: "message", from: { id: session.userId, role: "user" }, text, locale: "en-US" }),
    signal,
  });
  if (!posted.ok) return failureFrom(posted, "message send");
  const acknowledgment = await posted.json().catch(() => ({}));
  const userActivityId = acknowledgment.id as string | undefined;
  const deadline = Date.now() + 180_000;
  let candidate = "";
  let candidateAt = 0;
  let sources: SourceDocument[] = [];
  const seen = new Set<string>();

  // HTTP polling is deliberate. The documented activities endpoint plus the exact
  // watermark avoids stale stream URLs and safely resumes after transient gaps.
  while (Date.now() < deadline) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const batch = await getActivities(session, signal);
    if (batch.watermark !== undefined) session.watermark = batch.watermark;
    for (const activity of batch.activities || []) {
      if (activity.id && seen.has(activity.id)) continue;
      if (activity.id) seen.add(activity.id);
      if (activity.id === userActivityId || activity.from?.id === session.userId || activity.type !== "message") continue;
      const timestamp = activity.timestamp ? Date.parse(activity.timestamp) : Date.now();
      if (Number.isFinite(timestamp) && timestamp < sentAt - 1500) continue;
      const value = textFromActivity(activity);
      sources = mergeSourceDocuments([...sources, ...extractSourcesFromActivity({ ...activity, text: value || activity.text })]);
      if (!value || INTERMEDIATE.test(value) || value.length < 24) continue;
      candidate = value;
      candidateAt = Date.now();
    }
    if (candidate && Date.now() - candidateAt >= 2500) return { text: candidate, sources, session };
    await sleep(1000);
  }
  if (candidate) return { text: candidate, sources, session };
  throw new DirectLineError("Copilot Studio did not return a final answer within three minutes. Try the question again.", "request-failed");
}
