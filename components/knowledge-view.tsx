"use client";

import { useEffect, useMemo, useState } from "react";
import { DownloadIcon, OpenIcon, SearchIcon } from "@/components/icons";
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
      <div className="library-toolbar"><label className="search-field"><SearchIcon size={17}/><span className="sr-only">Search knowledge sources</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cited documents"/></label></div>
      {filtered.length ? <div className="document-grid">{filtered.map((source) => <article className="document-card" key={source.id}>
        <img src={fileIconFor(source)} alt="" width="42" height="42"/>
        <div className="document-details"><h3>{source.name}</h3><p>{source.location || source.fileType || "Knowledge source"}</p><span>Added from a grounded response</span></div>
        <div className="document-actions">{source.url && <a className="button secondary" href={source.url} target="_blank" rel="noreferrer"><OpenIcon size={15}/>Open</a>}{(source.downloadUrl || source.url) && <a className="button ghost" href={source.downloadUrl || source.url} target="_blank" rel="noreferrer" download><DownloadIcon size={15}/>Download</a>}</div>
      </article>)}</div> : <div className="empty-state"><img src="/assets/source-icons/folder.svg" alt="" width="64" height="64"/><h3>{query ? "No matching documents" : "No cited documents yet"}</h3><p>{query ? "Try a different search term." : "Ask a question in Chat. When Copilot returns supporting document metadata, it will be collected here."}</p></div>}
    </div>
  </section>;
}
