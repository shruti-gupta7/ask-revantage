const PROGRESS_PREFIX = /^(let me\b|i(?:'ll| will)\b|one moment\b|please wait\b|hang tight\b|searching\b|checking\b|looking (?:up|through|for)\b|retrieving\b|reading\b|i(?:['’]m| am) (?:checking|searching|reading|retrieving|looking|working)\b|working on\b|thanks for your patience\b)/i;
const PROGRESS_STATES = new Set(["processing", "progress", "searching", "thinking", "working", "retrieving", "typing"]);
const URL_PATTERN = /https?:\/\/[^\s<>()[\]{}"']+/gi;
const MARKDOWN_LINK_PATTERN = /\[([^\]]+)]\((https?:\/\/[^)]+)\)/gi;

export function activityText(activity) {
  if (typeof activity?.text === "string" && activity.text.trim()) return activity.text.trim();
  const textParts = [];
  for (const attachment of activity?.attachments || []) collectAdaptiveText(attachment?.content, textParts);
  return Array.from(new Set(textParts.map(value => value.trim()).filter(Boolean))).join("\n\n");
}

function collectAdaptiveText(node, output) {
  if (!node) return;
  if (Array.isArray(node)) return node.forEach(item => collectAdaptiveText(item, output));
  if (typeof node !== "object") return;
  if (typeof node.text === "string" && ["TextBlock", "RichTextBlock"].includes(node.type)) output.push(node.text);
  for (const value of Object.values(node)) if (value && typeof value === "object") collectAdaptiveText(value, output);
}

export function classifyBotActivity(activity) {
  const type = String(activity?.type || "").toLowerCase();
  if (["typing", "trace", "conversationupdate"].includes(type)) return { kind: "ignore", text: "" };
  if (type === "endofconversation") return { kind: "terminal", text: activityText(activity) };
  const text = activityText(activity);
  const state = String(activity?.channelData?.state || activity?.channelData?.status || activity?.value?.state || "").toLowerCase();
  const name = String(activity?.name || "").toLowerCase();
  const explicitProgress = PROGRESS_STATES.has(state) || /progress|processing|typing|searching/.test(name);
  if (type === "event" && !text) return { kind: explicitProgress ? "progress" : "metadata", text: "" };
  const concise = text.length <= 260 && text.split(/\n\s*\n/).length <= 2;
  if (!text && explicitProgress) return { kind: "progress", text: "" };
  if (concise && (explicitProgress || PROGRESS_PREFIX.test(text))) return { kind: "progress", text };
  if (text || (activity?.attachments || []).length) return { kind: "final", text };
  return { kind: "metadata", text: "" };
}

export function isCorrelatedActivity(activity, request) {
  if (!activity || !request) return false;
  if (activity?.from?.id && activity.from.id === request.userId) return false;
  if (activity.replyToId && request.activityId) return activity.replyToId === request.activityId;
  const timestamp = Date.parse(activity.timestamp || "");
  if (Number.isFinite(timestamp) && timestamp < request.sentAt - 2000) return false;
  return ["message", "event", "typing", "endOfConversation"].includes(activity.type);
}

function safeUrl(value) {
  if (typeof value !== "string") return "";
  try {
    const parsed = new URL(value, "http://localhost");
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return value;
  } catch { /* Not a safe URL. */ }
  return "";
}

function extensionFrom(title = "", url = "") {
  const match = `${title} ${url}`.match(/\.(pdf|docx?|xlsx?|pptx?|txt|csv)(?:\b|\?|#)/i);
  return match ? match[1].toUpperCase() : "LINK";
}

function addSource(output, candidate) {
  if (!candidate || typeof candidate !== "object") return;
  const url = safeUrl(candidate.url || candidate.contentUrl || candidate.sourceUrl || candidate.link || candidate.uri);
  const downloadUrl = safeUrl(candidate.downloadUrl || candidate.download || candidate.contentUrl);
  if (!url && !downloadUrl) return;
  const title = String(candidate.title || candidate.name || candidate.displayName || candidate.fileName || "Supporting source").trim();
  output.push({ title, url: url || downloadUrl, downloadUrl: downloadUrl || url, fileType: extensionFrom(title, url || downloadUrl) });
}

function walkForSources(node, output, seen = new WeakSet()) {
  if (!node || typeof node !== "object") return;
  if (seen.has(node)) return;
  seen.add(node);
  if (Array.isArray(node)) return node.forEach(item => walkForSources(item, output, seen));
  if (node.url || node.contentUrl || node.sourceUrl || node.downloadUrl || node.uri) addSource(output, node);
  if (typeof node.type === "string" && /openurl/i.test(node.type) && node.url) addSource(output, { title: node.title, url: node.url });
  for (const value of Object.values(node)) if (value && typeof value === "object") walkForSources(value, output, seen);
}

export function extractSources(activity) {
  const output = [];
  const buckets = [
    activity?.channelData?.citations,
    activity?.channelData?.sources,
    activity?.channelData?.sourceDocuments,
    activity?.channelData?.knowledgeSources,
    activity?.entities,
    activity?.attachments
  ];
  for (const bucket of buckets) walkForSources(bucket, output);

  const text = String(activity?.text || "");
  for (const match of text.matchAll(MARKDOWN_LINK_PATTERN)) addSource(output, { title: match[1], url: match[2] });
  const textWithoutMarkdown = text.replace(MARKDOWN_LINK_PATTERN, "");
  for (const url of textWithoutMarkdown.match(URL_PATTERN) || []) addSource(output, { title: "Supporting source", url: url.replace(/[.,;:!?]+$/, "") });
  return mergeSources([], output);
}

export function mergeSources(existing, incoming) {
  const map = new Map();
  for (const source of [...(existing || []), ...(incoming || [])]) {
    const key = `${String(source.url || "").toLowerCase()}|${String(source.title || "").toLowerCase()}`;
    if (!map.has(key)) map.set(key, source);
  }
  return Array.from(map.values());
}
