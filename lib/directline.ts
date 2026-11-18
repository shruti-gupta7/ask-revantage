import type { DirectLineSession, SourceDocument } from "@/lib/types";

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

const BASE_URL = "https://directline.botframework.com/v3/directline";
const INTERMEDIATE = /^(let me|one moment|just a moment|please wait|i(?:’|'| a)m (?:checking|looking|reading|retrieving)|checking|looking up|retrieving|searching)/i;
const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function createDirectLineSession(userId: string): Promise<DirectLineSession> {
  const response = await fetch("/api/directline/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Could not connect to Copilot Studio.");
  }
  const value = await response.json();
  return {
    token: value.token,
    conversationId: value.conversationId,
    expiresAt: Date.now() + Math.max(60, value.expires_in || 1800) * 1000,
    watermark: undefined,
  };
}

async function getActivities(session: DirectLineSession, signal?: AbortSignal): Promise<ActivitySet> {
  const suffix = session.watermark ? `?watermark=${encodeURIComponent(session.watermark)}` : "";
  const response = await fetch(`${BASE_URL}/conversations/${session.conversationId}/activities${suffix}`, {
    headers: { Authorization: `Bearer ${session.token}` },
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error(`Copilot Studio activity read failed (${response.status}).`);
  return response.json();
}

async function drainExistingActivities(session: DirectLineSession, signal?: AbortSignal) {
  const value = await getActivities(session, signal);
  if (value.watermark !== undefined) session.watermark = value.watermark;
}

function textFromActivity(activity: Activity) {
  if (activity.text?.trim()) return activity.text.trim();
  const attachments = Array.isArray(activity.attachments) ? activity.attachments : [];
  for (const attachment of attachments) {
    if (!attachment || typeof attachment !== "object") continue;
    const content = (attachment as { content?: unknown }).content;
    if (!content || typeof content !== "object") continue;
    const value = content as { text?: unknown; body?: unknown[]; title?: unknown; subtitle?: unknown };
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

function walk(value: unknown, results: SourceDocument[], seen = new WeakSet<object>()) {
  if (!value || typeof value !== "object") return;
  if (seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item) => walk(item, results, seen));
    return;
  }
  const record = value as Record<string, unknown>;
  const url = [record.url, record.uri, record.contentUrl, record.sourceUrl, record.downloadUrl, record.link].find(
    (candidate) => typeof candidate === "string" && /^https?:\/\//i.test(candidate),
  ) as string | undefined;
  const name = [record.name, record.title, record.filename, record.fileName, record.displayName].find(
    (candidate) => typeof candidate === "string" && candidate.trim(),
  ) as string | undefined;
  if (url || name) {
    const finalName = name || (() => { try { return new URL(url!).pathname.split("/").pop() || "Source document"; } catch { return "Source document"; } })();
    results.push({
      id: `${finalName}-${url || "metadata"}`,
      name: finalName,
      url,
      downloadUrl: typeof record.downloadUrl === "string" ? record.downloadUrl : undefined,
      fileType: typeof record.fileType === "string" ? record.fileType : undefined,
      location: typeof record.location === "string" ? record.location : undefined,
      lastSeenAt: new Date().toISOString(),
    });
  }
  Object.values(record).forEach((item) => walk(item, results, seen));
}

function sourcesFromActivity(activity: Activity) {
  const found: SourceDocument[] = [];
  walk(activity.entities, found);
  walk(activity.attachments, found);
  walk(activity.channelData, found);
  return found.filter((source, index, all) => index === all.findIndex((item) => item.url === source.url && item.name === source.name));
}

export async function askCopilot(
  session: DirectLineSession,
  userId: string,
  text: string,
  signal?: AbortSignal,
): Promise<{ text: string; sources: SourceDocument[]; session: DirectLineSession }> {
  await drainExistingActivities(session, signal);
  const sentAt = Date.now();
  const posted = await fetch(`${BASE_URL}/conversations/${session.conversationId}/activities`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.token}`, "content-type": "application/json" },
    body: JSON.stringify({ type: "message", from: { id: userId }, text, locale: "en-US" }),
    signal,
  });
  if (!posted.ok) throw new Error(`Copilot Studio message send failed (${posted.status}).`);
  const acknowledgment = await posted.json().catch(() => ({}));
  const userActivityId = acknowledgment.id as string | undefined;
  const deadline = Date.now() + 180_000;
  let candidate = "";
  let candidateAt = 0;
  let sources: SourceDocument[] = [];
  const seen = new Set<string>();

  while (Date.now() < deadline) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const batch = await getActivities(session, signal);
    if (batch.watermark !== undefined) session.watermark = batch.watermark;
    for (const activity of batch.activities || []) {
      if (activity.id && seen.has(activity.id)) continue;
      if (activity.id) seen.add(activity.id);
      if (activity.id === userActivityId || activity.from?.id === userId || activity.type !== "message") continue;
      const timestamp = activity.timestamp ? Date.parse(activity.timestamp) : Date.now();
      if (Number.isFinite(timestamp) && timestamp < sentAt - 1500) continue;
      sources = [...sources, ...sourcesFromActivity(activity)].filter((source, index, all) =>
        index === all.findIndex((item) => item.url === source.url && item.name === source.name),
      );
      const value = textFromActivity(activity);
      if (!value || INTERMEDIATE.test(value) || value.length < 24) continue;
      candidate = value;
      candidateAt = Date.now();
    }
    if (candidate && Date.now() - candidateAt >= 2500) return { text: candidate, sources, session };
    await sleep(candidate ? 500 : 900);
  }
  if (candidate) return { text: candidate, sources, session };
  throw new Error("Copilot Studio did not return a final answer within three minutes. Try the question again.");
}
