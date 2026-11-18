"use client";

import { useMemo, useState } from "react";
import { DownloadIcon, ExternalIcon, FileIcon, SearchIcon } from "./icons";

const documents = [
  { title: "Cab & Employee Transportation Policy", type: "PDF", area: "Workplace Mobility", updated: "Demo source", url: "/demo/Ask_Revantage_Demo_Cab_Policy.pdf" },
  { title: "Business Travel Quick Guide", type: "PDF", area: "Travel & Expense", updated: "Demo source", url: "/demo/Business_Travel_Quick_Guide.pdf" },
  { title: "Workplace Access Handbook", type: "PDF", area: "Workplace Access", updated: "Demo source", url: "/demo/Workplace_Access_Handbook.pdf" },
  { title: "Security Incident Checklist", type: "PDF", area: "Security Operations", updated: "Demo source", url: "/demo/Security_Incident_Checklist.pdf" }
];

export function KnowledgeView() {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => documents.filter(doc => `${doc.title} ${doc.area} ${doc.type}`.toLowerCase().includes(query.toLowerCase())), [query]);
  return <section className="content-page">
    <div className="page-heading"><div><span className="eyebrow">Connected knowledge</span><h1>Knowledge Library</h1><p>Find the fictional files used in this hackathon experience.</p></div><span className="count-badge">{documents.length} sources</span></div>
    <div className="search-box glass-card"><SearchIcon /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by title, service area or file type" aria-label="Search knowledge documents" /></div>
    <div className="document-grid">{visible.map(doc => <article className="document-card glass-card" key={doc.title}>
      <div className="document-icon"><FileIcon /><span>{doc.type}</span></div>
      <div className="document-meta"><span>{doc.area}</span><small>{doc.updated}</small></div>
      <h2>{doc.title}</h2>
      <p>Fictional content created for the Ask Revantage hackathon demonstration.</p>
      <div className="card-actions"><a className="button secondary" href={doc.url} target="_blank" rel="noreferrer"><ExternalIcon />Open</a><a className="button ghost" href={doc.url} download><DownloadIcon />Download</a></div>
    </article>)}</div>
    {!visible.length && <div className="empty-state">No demo sources match that search.</div>}
  </section>;
}
