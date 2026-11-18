"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { DownloadIcon, OpenIcon, SearchIcon } from "@/components/icons";
import { isPdfSource, sourceDownloadUrl, sourceViewUrl } from "@/lib/source-links";
import { fileIconFor, readStoredSources } from "@/lib/source-storage";
import type { SourceDocument } from "@/lib/types";

export function KnowledgeView() {
  const [sources, setSources] = useState<SourceDocument[]>([]);
  const [query, setQuery] = useState("");
  useEffect(() => {
    const refresh = () => setSources(readStoredSources());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("ask-revantage:sources", refresh as EventListener);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener("ask-revantage:sources", refresh as EventListener); };
  }, []);
  const filtered = useMemo(() => sources.filter((source) => `${source.name} ${source.fileType || ""} ${source.location || ""}`.toLowerCase().includes(query.toLowerCase())), [sources, query]);

  return <section className="page-content knowledge-page">
    <div className="page-heading"><div><span className="eyebrow">CURRENT CONVERSATION</span><h2>Ask Revantage - Hackathon Knowledge Base</h2><p>Documents appear here when Ask Revantage Bot cites them in a response.</p></div><span className="count-badge">{sources.length} {sources.length === 1 ? "document" : "documents"}</span></div>
    <div className="library-card">
      <div className="library-toolbar"><label className="search-field"><SearchIcon size={17}/><span className="sr-only">Search knowledge sources</span><input value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} placeholder="Search cited documents"/></label></div>
      {filtered.length ? <div className="document-grid">{filtered.map((source) => {
        const viewUrl = sourceViewUrl(source);
        const downloadUrl = sourceDownloadUrl(source);
        const pdf = isPdfSource(source);
        return <article className={`document-card ${pdf ? "is-pdf" : ""}`} key={source.id}>
          {viewUrl ? <a className="document-main-link" href={viewUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${source.name} in a new tab`}>
            <img src={fileIconFor(source)} alt="" width="42" height="42"/>
            <div className="document-details"><h3>{source.name}</h3><p>{source.location || source.fileType || (pdf ? "PDF document" : "Knowledge source")}</p><span>Ready to open from the cited source</span></div>
          </a> : <div className="document-main-link is-disabled">
            <img src={fileIconFor(source)} alt="" width="42" height="42"/>
            <div className="document-details"><h3>{source.name}</h3><p>{source.location || source.fileType || (pdf ? "PDF document" : "Knowledge source")}</p><span>Unavailable: Copilot returned the source name without a document URL.</span></div>
          </div>}
          {pdf && <span className="pdf-badge">PDF</span>}
          {(viewUrl || downloadUrl) && <div className="document-actions">{viewUrl && <a className="button secondary" href={viewUrl} target="_blank" rel="noopener noreferrer"><OpenIcon size={15}/>Open</a>}{downloadUrl && <a className="button ghost" href={downloadUrl} target="_blank" rel="noopener noreferrer" download><DownloadIcon size={15}/>Download</a>}</div>}
        </article>;
      })}</div> : <div className="empty-state"><img src="/assets/source-icons/folder.svg" alt="" width="64" height="64"/><h3>{query ? "No matching documents" : "No cited documents yet"}</h3><p>{query ? "Try a different search term." : "Ask a question in Chat. When Copilot returns supporting document metadata, it will be collected here."}</p></div>}
    </div>
  </section>;
}
