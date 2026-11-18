import type { SourceDocument } from "@/lib/types";

type LinkableSource = Pick<SourceDocument, "name" | "url">;
type DownloadableSource = Pick<SourceDocument, "name" | "url" | "downloadUrl">;

/**
 * Explicit filename allowlist for the fictional PDFs shipped with the demo.
 * Copilot Studio file citations often include a title but no web URL. These
 * mappings make only known, repository-owned files openable. Unknown filenames
 * still remain unavailable instead of being converted into guessed links.
 */
const LOCAL_KNOWLEDGE_DOCUMENTS = [
  {
    path: "/knowledge/Revantage_Cab_and_Office_Transport_Policy.pdf",
    aliases: [
      "Revantage_Cab_and_Office_Transport_Policy.pdf",
      "Ask_Revantage_Demo_Cab_Policy.pdf",
      "Cab and Office Transport Policy.pdf",
      "Cab and Office Transport Policy",
    ],
  },
  {
    path: "/knowledge/Revantage_Leave_and_Time_Off_Policy.pdf",
    aliases: [
      "Revantage_Leave_and_Time_Off_Policy.pdf",
      "ask-revantage-synthetic-hr-policy.pdf",
      "HR Policy.pdf",
      "Employee Leave and Time Off Policy.pdf",
      "Example People Leave & Time Away Policy.pdf",
      "Employee Leave and Time Off Policy",
      "Example People Leave & Time Away Policy",
    ],
  },
  {
    path: "/knowledge/Revantage_Travel_and_Expense_Policy.pdf",
    aliases: [
      "Revantage_Travel_and_Expense_Policy.pdf",
      "Travel and Expense Policy.pdf",
      "Travel and Expense Policy",
    ],
  },
] as const;

function normalizedDocumentName(value: string) {
  const withoutQuery = value.trim().split(/[?#]/, 1)[0];
  const basename = withoutQuery.split(/[\\/]/).pop() || withoutQuery;
  try {
    return decodeURIComponent(basename).trim().toLowerCase().replace(/\s+/g, " ");
  } catch {
    return basename.trim().toLowerCase().replace(/\s+/g, " ");
  }
}

export function localKnowledgeUrl(name: string | undefined) {
  if (!name) return undefined;
  const normalized = normalizedDocumentName(name);
  return LOCAL_KNOWLEDGE_DOCUMENTS.find((document) =>
    document.aliases.some((alias) => normalizedDocumentName(alias) === normalized),
  )?.path;
}

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

export function sourceViewUrl(source: LinkableSource) {
  return usableSourceUrl(source.url) || localKnowledgeUrl(source.name);
}

export function sourceDownloadUrl(source: DownloadableSource) {
  const explicit = usableSourceUrl(source.downloadUrl);
  if (explicit) return explicit;
  const viewUrl = sourceViewUrl(source);
  if (!viewUrl) return undefined;
  try {
    const pathname = viewUrl.startsWith("/") ? viewUrl : new URL(viewUrl).pathname;
    return /\.(?:pdf|docx?|xlsx?|csv|pptx?)$/i.test(pathname) ? viewUrl : undefined;
  } catch {
    return undefined;
  }
}
