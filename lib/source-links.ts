import type { SourceDocument } from "@/lib/types";

/** Accept only browser-safe document URLs. Copilot-provided URLs are preserved verbatim. */
export function usableSourceUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const candidate = value.trim();
  if (!candidate) return undefined;
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? candidate : undefined;
  } catch {
    return undefined;
  }
}

export function safeMarkdownUrl(value: string): string {
  const candidate = value.trim();
  if (candidate.startsWith("#")) return candidate;
  try {
    const parsed = new URL(candidate);
    return ["https:", "http:", "mailto:"].includes(parsed.protocol) ? candidate : "";
  } catch {
    return "";
  }
}

export function isPdfSource(source: Pick<SourceDocument, "name" | "fileType" | "url">) {
  return /(?:\bpdf\b|\.pdf(?:$|[?#]))/i.test(`${source.fileType || ""} ${source.name} ${source.url || ""}`);
}

export function sourceViewUrl(source: Pick<SourceDocument, "url">) {
  return usableSourceUrl(source.url);
}

export function sourceDownloadUrl(source: Pick<SourceDocument, "url" | "downloadUrl">) {
  const explicit = usableSourceUrl(source.downloadUrl);
  if (explicit) return explicit;
  const viewUrl = usableSourceUrl(source.url);
  if (!viewUrl) return undefined;
  try {
    return /\.(?:pdf|docx?|xlsx?|csv|pptx?)$/i.test(new URL(viewUrl).pathname) ? viewUrl : undefined;
  } catch {
    return undefined;
  }
}
