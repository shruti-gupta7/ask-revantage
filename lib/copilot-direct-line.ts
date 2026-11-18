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
  entities?: unknown[];
  attachments?: Array<{ contentType?: string; contentUrl?: string; name?: string; content?: unknown }>;
  channelData?: UnknownRecord;
  suggestedActions?: { actions?: Array<{ title?: string; value?: string; displayText?: string }> };
};

const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

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
  const tokenResponse = await fetch("/api/copilot/token", { method: "POST", cache: "no-store" });
  const tokenPayload = await tokenResponse.json();
  if (!tokenResponse.ok) throw new Error(tokenPayload.error || "Copilot Studio is not available.");

  const conversationResponse = await fetch(`${tokenPayload.endpoint}/conversations`, {
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
    watermark: "",
    seenActivityIds: new Set<string>(),
    expiresAt: Date.now() + Number(conversation.expires_in || tokenPayload.expiresIn || 1800) * 1000,
  };
}

async function refreshDirectLineToken(session: DirectLineSession) {
  if (Date.now() <= session.expiresAt - 60_000) return;
  const response = await fetch(`${session.endpoint}/tokens/refresh`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.token}` },
  });
  const payload = await response.json();
  if (!response.ok || !payload.token) throw new Error("The Copilot conversation expired. Please start a new conversation.");
  session.token = payload.token;
  session.expiresAt = Date.now() + Number(payload.expires_in || 1800) * 1000;
}

export async function sendToCopilot(session: DirectLineSession, text: string): Promise<CopilotReply> {
  await refreshDirectLineToken(session);

  const sendResponse = await fetch(`${session.endpoint}/conversations/${encodeURIComponent(session.conversationId)}/activities`, {
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

  const received: DirectLineActivity[] = [];
  let quietPolls = 0;
  for (let attempt = 0; attempt < 28; attempt += 1) {
    await wait(attempt === 0 ? 450 : 650);
    const suffix = session.watermark ? `?watermark=${encodeURIComponent(session.watermark)}` : "";
    const response = await fetch(`${session.endpoint}/conversations/${encodeURIComponent(session.conversationId)}/activities${suffix}`, {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: "no-store",
    });
    if (!response.ok) continue;
    const payload = await response.json();
    session.watermark = payload.watermark || session.watermark;
    const fresh = ((payload.activities || []) as DirectLineActivity[]).filter((activity) => {
      if (!activity.id || session.seenActivityIds.has(activity.id)) return false;
      session.seenActivityIds.add(activity.id);
      return activity.from?.role === "bot" && activity.type === "message";
    });
    if (fresh.length) {
      received.push(...fresh);
      quietPolls = 0;
    } else if (received.length) {
      quietPolls += 1;
      if (quietPolls >= 2) break;
    }
  }

  const meaningful = received.filter((activity) => activity.text?.trim());
  const answer = meaningful.at(-1);
  if (!answer?.text) throw new Error("Copilot Studio did not return an answer in time.");

  const citations = received.flatMap(extractCitations);
  const unique = new Map<string, CopilotCitation>();
  for (const citation of citations) unique.set(`${citation.title}|${citation.url || citation.id}`, citation);

  return {
    text: answer.text.trim(),
    citations: [...unique.values()],
    suggestedActions: extractSuggestedActions(answer),
  };
}

export function isUnsupportedCopilotReply(text: string, citations: CopilotCitation[]) {
  if (citations.length) return false;
  return /(?:i(?:'m| am) sorry|i (?:can(?:not|'t)|could(?: not|n't)|do not|don't) (?:find|answer|help|locate)|unable to (?:find|answer|locate)|no (?:relevant )?(?:information|answer|document) (?:is )?(?:available|found)|not (?:available|found) in (?:my|the) knowledge|contact (?:a |the )?(?:support|human|administrator)|outside (?:my|the) knowledge|i (?:do not|don't) know)/i.test(text);
}
