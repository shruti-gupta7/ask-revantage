export type CopilotCitation = {
  id: string;
  title: string;
  url?: string;
  description?: string;
  provider?: string;
  mimeType?: string;
  downloadName?: string;
};

export type CopilotReply = {
  text: string;
  citations: CopilotCitation[];
  suggestedActions: Array<{ title: string; value: string }>;
};

export type DirectLineSession = {
  token: string;
  conversationId: string;
  userId: string;
  endpoint: string;
  streamUrl?: string;
  watermark: string;
  seenActivityIds: Set<string>;
  expiresAt: number;
};

type UnknownRecord = Record<string, unknown>;
type DirectLineActivity = UnknownRecord & {
  id?: string;
  type?: string;
  text?: string;
  from?: { id?: string; role?: string };
  replyToId?: string;
  timestamp?: string;
  inputHint?: string;
  entities?: unknown[];
  attachments?: Array<{ contentType?: string; contentUrl?: string; name?: string; content?: unknown }>;
  channelData?: UnknownRecord;
  suggestedActions?: { actions?: Array<{ title?: string; value?: string; displayText?: string }> };
};

const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));
const RESPONSE_TIMEOUT_MS = 75_000;
const REQUEST_TIMEOUT_MS = 15_000;

function record(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : null;
}

function stringValue(...values: unknown[]) {
  return values.find((value) => typeof value === "string" && value.trim()) as string | undefined;
}

function citationCandidates(activity: DirectLineActivity) {
  const candidates: unknown[] = [];
  const add = (value: unknown) => {
    if (Array.isArray(value)) candidates.push(...value);
    else if (value) candidates.push(value);
  };

  for (const entityValue of activity.entities || []) {
    const entity = record(entityValue);
    if (!entity) continue;
    const rawType = entity.type ?? entity["@type"];
    const type = Array.isArray(rawType) ? rawType.filter((value) => typeof value === "string").join(" ") : stringValue(rawType) || "";
    if (type.includes("schema.org/Message") || type.includes("Message")) {
      add(entity.citation);
      add(entity.citations);
      add(entity.references);
      add(entity.sources);
    } else if (/citation|creativework|source/i.test(type)) {
      add(entity);
    }
  }

  const channelData = record(activity.channelData);
  if (channelData) {
    add(channelData.citations);
    add(channelData.citation);
    add(channelData.sources);
  }

  for (const attachment of activity.attachments || []) {
    const content = record(attachment.content);
    if (content) {
      add(content.citations);
      add(content.citation);
      add(content.sources);
      if (/citation|source/i.test(attachment.contentType || "")) add(content);
    }
  }

  return candidates;
}

export function extractCitations(activity: DirectLineActivity): CopilotCitation[] {
  const citations: CopilotCitation[] = [];
  citationCandidates(activity).forEach((candidate, index) => {
    if (typeof candidate === "string") {
      const isUrl = /^https?:\/\//i.test(candidate);
      citations.push({
        id: candidate,
        title: isUrl ? `Source ${index + 1}` : candidate,
        url: isUrl ? candidate : undefined,
      });
      return;
    }
    const item = record(candidate);
    if (!item) return;
    const urlObject = record(item.url);
    const file = record(item.file);
    const reference = record(item.reference);
    const document = record(item.document);
    const title = stringValue(item.name, item.title, item.headline, file?.name, reference?.name, reference?.title, document?.name, document?.title) || `Source ${index + 1}`;
    const url = stringValue(item.url, urlObject?.url, item.contentUrl, item.contentLocation, item.downloadUrl, file?.url, reference?.url, reference?.contentUrl, document?.url);
    const description = stringValue(item.description, item.text, item.snippet, item.abstract, reference?.description, document?.description);
    const providerObject = record(item.provider);
    const provider = stringValue(item.provider, providerObject?.name, item.source);
    const mimeType = stringValue(item.encodingFormat, item.mimeType, item.contentType);
    const downloadName = stringValue(item.fileName, file?.name, reference?.fileName, document?.fileName) || (url ? decodeURIComponent(url.split("/").pop()?.split("?")[0] || "") : undefined);
    citations.push({
      id: stringValue(item.id, item["@id"]) || `${title}-${url || index}`,
      title,
      url,
      description,
      provider,
      mimeType,
      downloadName,
    });
  });

  const unique = new Map<string, CopilotCitation>();
  for (const citation of citations) unique.set(`${citation.title}|${citation.url || citation.id}`, citation);
  return [...unique.values()];
}

function extractSuggestedActions(activity: DirectLineActivity) {
  return (activity.suggestedActions?.actions || []).map((action) => ({
    title: action.title || action.displayText || action.value || "Continue",
    value: action.value || action.title || action.displayText || "",
  })).filter((action) => action.value);
}

export async function createDirectLineSession(): Promise<DirectLineSession> {
  const tokenResponse = await fetchWithTimeout("/api/copilot/token", { method: "POST", cache: "no-store" });
  const tokenPayload = await tokenResponse.json();
  if (!tokenResponse.ok) throw new Error(tokenPayload.error || "Copilot Studio is not available.");

  const conversationResponse = await fetchWithTimeout(`${tokenPayload.endpoint}/conversations`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tokenPayload.token}`, "Content-Type": "application/json" },
  });
  const conversation = await conversationResponse.json();
  if (!conversationResponse.ok || !conversation.conversationId) throw new Error("Copilot Studio could not open a conversation.");

  return {
    token: conversation.token || tokenPayload.token,
    conversationId: conversation.conversationId,
    userId: tokenPayload.userId,
    endpoint: tokenPayload.endpoint,
    streamUrl: conversation.streamUrl,
    watermark: "",
    seenActivityIds: new Set<string>(),
    expiresAt: Date.now() + Number(conversation.expires_in || tokenPayload.expiresIn || 1800) * 1000,
  };
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeout = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

async function refreshDirectLineToken(session: DirectLineSession, force = false) {
  if (!force && Date.now() <= session.expiresAt - 60_000) return;
  const response = await fetchWithTimeout(`${session.endpoint}/tokens/refresh`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.token}` },
  });
  const payload = await response.json();
  if (!response.ok || !payload.token) throw new Error("The Copilot conversation expired. Please start a new conversation.");
  session.token = payload.token;
  session.expiresAt = Date.now() + Number(payload.expires_in || 1800) * 1000;
}

function activityHasContent(activity: DirectLineActivity) {
  return Boolean(
    activity.text?.trim()
    || activity.entities?.length
    || activity.attachments?.length
    || activity.suggestedActions?.actions?.length,
  );
}

function isAgentMessage(activity: DirectLineActivity, session: DirectLineSession) {
  if (activity.type !== "message" || !activityHasContent(activity)) return false;
  if (activity.from?.id === session.userId || activity.from?.role === "user") return false;
  return true;
}

function belongsToCurrentTurn(activity: DirectLineActivity, sentActivityId: string, sentAt: number) {
  if (activity.replyToId === sentActivityId) return true;
  const timestamp = activity.timestamp ? Date.parse(activity.timestamp) : Number.NaN;
  if (Number.isFinite(timestamp)) return timestamp >= sentAt - 1_000;
  return !activity.replyToId;
}

async function getActivities(session: DirectLineSession) {
  const suffix = session.watermark ? `?watermark=${encodeURIComponent(session.watermark)}` : "";
  let response = await fetchWithTimeout(
    `${session.endpoint}/conversations/${encodeURIComponent(session.conversationId)}/activities${suffix}`,
    { headers: { Authorization: `Bearer ${session.token}` }, cache: "no-store" },
  );

  if (response.status === 401) {
    await refreshDirectLineToken(session, true);
    response = await fetchWithTimeout(
      `${session.endpoint}/conversations/${encodeURIComponent(session.conversationId)}/activities${suffix}`,
      { headers: { Authorization: `Bearer ${session.token}` }, cache: "no-store" },
    );
  }

  if (response.status === 403) {
    throw new Error("The Copilot Studio agent did not allow this conversation. Check the agent authentication and channel access settings.");
  }
  if (response.status === 404 || response.status === 410) {
    throw new Error("The Copilot conversation expired. Please send the question again.");
  }
  if (!response.ok) {
    if (response.status === 429 || response.status >= 500) return [] as DirectLineActivity[];
    throw new Error("Ask Revant Bot could not read the Copilot Studio response.");
  }

  const payload = await response.json();
  if (payload.watermark !== undefined && payload.watermark !== null) session.watermark = String(payload.watermark);
  return Array.isArray(payload.activities) ? payload.activities as DirectLineActivity[] : [];
}

async function drainExistingActivities(session: DirectLineSession) {
  try {
    const activities = await getActivities(session);
    for (const activity of activities) {
      if (activity.id) session.seenActivityIds.add(activity.id);
    }
  } catch {
    // A first read can race with conversation setup. Timestamps and activity IDs
    // still prevent stale welcome messages from becoming the next answer.
  }
}

export async function sendToCopilot(session: DirectLineSession, text: string): Promise<CopilotReply> {
  await refreshDirectLineToken(session);
  await drainExistingActivities(session);

  const sentAt = Date.now();
  const sendResponse = await fetchWithTimeout(`${session.endpoint}/conversations/${encodeURIComponent(session.conversationId)}/activities`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "message",
      from: { id: session.userId, name: "User", role: "user" },
      text,
      locale: "en-US",
      channelData: { source: "ask-revantage-custom-ui" },
    }),
  });
  if (!sendResponse.ok) throw new Error("The question could not be sent to Copilot Studio.");
  const sent = await sendResponse.json();
  const sentActivityId = typeof sent.id === "string" ? sent.id : "";

  const received: DirectLineActivity[] = [];
  const deadline = sentAt + RESPONSE_TIMEOUT_MS;
  let lastAnswerAt = 0;
  let finalSignalAt = 0;
  let firstPoll = true;

  while (Date.now() < deadline) {
    await wait(firstPoll ? 450 : 900);
    firstPoll = false;

    let activities: DirectLineActivity[] = [];
    try {
      activities = await getActivities(session);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") continue;
      throw error;
    }

    for (const activity of activities) {
      if (!activity.id || session.seenActivityIds.has(activity.id)) continue;
      session.seenActivityIds.add(activity.id);
      if (!isAgentMessage(activity, session) || !belongsToCurrentTurn(activity, sentActivityId, sentAt)) continue;
      received.push(activity);
      if (activity.text?.trim()) lastAnswerAt = Date.now();
      if (activity.inputHint === "acceptingInput") finalSignalAt = Date.now();
    }

    if (lastAnswerAt) {
      const quietFor = Date.now() - lastAnswerAt;
      if ((finalSignalAt && quietFor >= 750) || quietFor >= 2_700) break;
    }
  }

  const meaningful = received.filter((activity) => activity.text?.trim());
  const answer = meaningful.at(-1);
  if (!answer?.text) {
    throw new Error("Ask Revant Bot is taking longer than expected. No completed answer was received within 75 seconds. Please try again.");
  }

  const citations = received.flatMap(extractCitations);
  const unique = new Map<string, CopilotCitation>();
  for (const citation of citations) unique.set(`${citation.title}|${citation.url || citation.id}`, citation);

  return {
    text: answer.text.trim(),
    citations: [...unique.values()],
    suggestedActions: extractSuggestedActions([...received].reverse().find((activity) => activity.suggestedActions?.actions?.length) || answer),
  };
}

export function isUnsupportedCopilotReply(text: string, citations: CopilotCitation[]) {
  if (citations.length) return false;
  return /(?:i(?:'m| am) sorry|i (?:can(?:not|'t)|could(?: not|n't)|do not|don't) (?:find|answer|help|locate)|unable to (?:find|answer|locate)|no (?:relevant )?(?:information|answer|document) (?:is )?(?:available|found)|not (?:available|found) in (?:my|the) knowledge|contact (?:a |the )?(?:support|human|administrator)|outside (?:my|the) knowledge|i (?:do not|don't) know)/i.test(text);
}
