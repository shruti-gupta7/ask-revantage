import type { SourceDocument } from "@/lib/types";

export const SOURCE_STORAGE_KEY = "ask-revantage-sources-v1";

export function readStoredSources(): SourceDocument[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(SOURCE_STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function storeSources(sources: SourceDocument[]) {
  if (typeof window === "undefined" || !sources.length) return;
  const current = readStoredSources();
  const merged: SourceDocument[] = [];
  for (const source of [...sources, ...current]) {
    const name = source.name.trim().toLowerCase();
    const existingIndex = merged.findIndex((candidate) =>
      (source.url && candidate.url === source.url) || candidate.name.trim().toLowerCase() === name,
    );
    if (existingIndex < 0) {
      merged.push(source);
      continue;
    }
    const existing = merged[existingIndex];
    merged[existingIndex] = {
      ...source,
      ...existing,
      id: existing.url ? `${existing.name}-${existing.url}` : source.id,
      url: existing.url || source.url,
      downloadUrl: existing.downloadUrl || source.downloadUrl,
      fileType: existing.fileType || source.fileType,
      location: existing.location || source.location,
      lastSeenAt: existing.lastSeenAt || source.lastSeenAt,
    };
  }
  merged.splice(100);
  localStorage.setItem(SOURCE_STORAGE_KEY, JSON.stringify(merged));
  window.dispatchEvent(new CustomEvent("ask-revantage:sources", { detail: merged }));
}

export function fileIconFor(source: Pick<SourceDocument, "name" | "fileType">) {
  const value = `${source.fileType || ""} ${source.name}`.toLowerCase();
  if (value.includes("pdf")) return "/assets/source-icons/pdf.svg";
  if (/word|docx?/.test(value)) return "/assets/source-icons/word.svg";
  if (/excel|xlsx?|csv/.test(value)) return "/assets/source-icons/excel.svg";
  if (/powerpoint|pptx?/.test(value)) return "/assets/source-icons/powerpoint.svg";
  if (/sharepoint/.test(value)) return "/assets/source-icons/sharepoint.svg";
  if (/onedrive/.test(value)) return "/assets/source-icons/onedrive.svg";
  if (/folder|library/.test(value)) return "/assets/source-icons/folder.svg";
  return "/assets/source-icons/upload.svg";
}
