import { usableSourceUrl } from "@/lib/source-links";
import type { SourceDocument } from "@/lib/types";

const URL_KEYS = ["url", "uri", "contentUrl", "sourceUrl", "webUrl", "documentUrl", "openUrl", "downloadUrl", "link", "href", "@id", "sameAs"];
const NAME_KEYS = ["name", "title", "filename", "fileName", "displayName", "documentName", "sourceName"];
const GENERIC_NAMES = /^(?:pdf|document|source document|source|open|download|view|view source|learn more|citation|link)$/i;
const DOCUMENT_NAME = /\.(?:pdf|docx?|xlsx?|csv|pptx?)(?:$|[?#])/i;

type Context = { name?: string; fileType?: string; location?: string };
type Candidate = Omit<SourceDocument, "id" | "lastSeenAt">;

function textField(record: Record<string, unknown>, keys: string[]) {
  return keys.map((key) => record[key]).find((value) => typeof value === "string" && value.trim()) as string | undefined;
}

function fileNameFromUrl(value: string | undefined) {
  if (!value) return undefined;
  try {
    const last = new URL(value).pathname.split("/").filter(Boolean).pop();
    return last ? decodeURIComponent(last) : undefined;
  } catch {
    return undefined;
  }
}

function usefulName(value: string | undefined) {
  if (!value) return undefined;
  const candidate = value.trim();
  return candidate && !GENERIC_NAMES.test(candidate) ? candidate : undefined;
}

function inferredFileType(name: string | undefined, url: string | undefined, explicit?: string) {
  if (explicit?.trim()) return explicit.trim();
  const match = `${name || ""} ${url || ""}`.match(/\.(pdf|docx?|xlsx?|csv|pptx?)(?:$|[?#\s])/i);
  return match?.[1]?.toUpperCase();
}

function walk(value: unknown, output: Candidate[], context: Context = {}, seen = new WeakSet<object>()) {
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item) => walk(item, output, context, seen));
    return;
  }

  const record = value as Record<string, unknown>;
  const appearance = record.appearance && typeof record.appearance === "object" && !Array.isArray(record.appearance)
    ? record.appearance as Record<string, unknown>
    : undefined;
  const localName = textField(record, NAME_KEYS) || (appearance ? textField(appearance, NAME_KEYS) : undefined);
  const localFileType = textField(record, ["fileType", "mimeType", "contentType", "extension"]);
  const localLocation = textField(record, ["location", "siteName", "sourceLocation", "libraryName"]);
  const inheritedName = usefulName(localName) || context.name;
  const nextContext: Context = {
    name: inheritedName || (localName && DOCUMENT_NAME.test(localName) ? localName : context.name),
    fileType: localFileType || context.fileType,
    location: localLocation || context.location,
  };

  const rawUrl = URL_KEYS.map((key) => record[key]).find((candidate) => usableSourceUrl(candidate));
  const url = usableSourceUrl(rawUrl);
  const downloadUrl = usableSourceUrl(record.downloadUrl) || (/download/i.test(localName || "") ? url : undefined);
  if (url) {
    const name = usefulName(localName) || usefulName(context.name) || localName?.trim() || fileNameFromUrl(url) || "Source document";
    output.push({
      name,
      url,
      downloadUrl,
      fileType: inferredFileType(name, url, localFileType || nextContext.fileType),
      location: localLocation || nextContext.location,
    });
  } else if (localName && DOCUMENT_NAME.test(localName)) {
    output.push({
      name: localName.trim(),
      fileType: inferredFileType(localName, undefined, localFileType || nextContext.fileType),
      location: localLocation || nextContext.location,
    });
  }

  Object.values(record).forEach((item) => walk(item, output, nextContext, seen));
}

function fromText(text: string) {
  const output: Candidate[] = [];
  const markdownLink = /\[([^\]]+)]\((https?:\/\/[^\s)]+(?:\)[^\s)]*)?)\)/gi;
  for (const match of text.matchAll(markdownLink)) {
    const url = usableSourceUrl(match[2]);
    if (!url) continue;
    const name = usefulName(match[1]) || fileNameFromUrl(url) || "Source document";
    output.push({ name, url, fileType: inferredFileType(name, url) });
  }

  const textWithoutUrls = text.replace(/https?:\/\/[^\s)]+/gi, "");
  const pdfNames = textWithoutUrls.match(/(?:[A-Za-z0-9][A-Za-z0-9 _.,&'()\-]*\.pdf)\b/gi) || [];
  pdfNames.forEach((name) => output.push({ name: name.trim(), fileType: "PDF" }));
  return output;
}

function normalizedName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function mergeCandidates(candidates: Candidate[]): Candidate[] {
  const merged: Candidate[] = [];
  for (const candidate of candidates) {
    const sameIndex = merged.findIndex((item) =>
      (candidate.url && item.url === candidate.url) || normalizedName(item.name) === normalizedName(candidate.name),
    );
    if (sameIndex < 0) {
      merged.push(candidate);
      continue;
    }
    const current = merged[sameIndex];
    merged[sameIndex] = {
      ...current,
      ...candidate,
      name: usefulName(candidate.name) || usefulName(current.name) || candidate.name,
      url: candidate.url || current.url,
      downloadUrl: candidate.downloadUrl || current.downloadUrl,
      fileType: candidate.fileType || current.fileType,
      location: candidate.location || current.location,
    };
  }

  const namedDocuments = merged.filter((item) => DOCUMENT_NAME.test(item.name));
  const genericWithUrl = merged.filter((item) => item.url && !usefulName(item.name));
  if (namedDocuments.length === 1 && genericWithUrl.length === 1) {
    const document = namedDocuments[0];
    const generic = genericWithUrl[0];
    document.url = generic.url;
    document.downloadUrl = generic.downloadUrl;
    const index = merged.indexOf(generic);
    if (index >= 0 && generic !== document) merged.splice(index, 1);
  }

  return merged.filter((item) => item.url || DOCUMENT_NAME.test(item.name));
}

export function extractSourcesFromActivity(activity: {
  text?: string;
  entities?: unknown[];
  attachments?: unknown[];
  channelData?: unknown;
}) {
  const candidates: Candidate[] = [];
  walk(activity.entities, candidates);
  walk(activity.attachments, candidates);
  walk(activity.channelData, candidates);
  if (activity.text) candidates.push(...fromText(activity.text));

  const now = new Date().toISOString();
  return mergeCandidates(candidates).map((source) => ({
    ...source,
    id: `${source.name}-${source.url || "metadata"}`,
    lastSeenAt: now,
  }));
}

export function mergeSourceDocuments(sources: SourceDocument[]) {
  const merged = mergeCandidates(sources.map(({ name, url, downloadUrl, fileType, location }) => ({
    name,
    url,
    downloadUrl,
    fileType,
    location,
  })));
  const now = new Date().toISOString();
  return merged.map((source) => ({
    ...source,
    id: `${source.name}-${source.url || "metadata"}`,
    lastSeenAt: now,
  }));
}
