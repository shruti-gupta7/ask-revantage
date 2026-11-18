"use client";

import { useEffect, useState } from "react";
import { CheckIcon, PlusIcon } from "@/components/icons";

const sourceTypes = [
  { name: "Copilot Studio", description: "Live knowledge-grounded agent", icon: "/assets/source-icons/copilot-studio.svg", key: "copilot" },
  { name: "Microsoft SharePoint", description: "Sites and document libraries", icon: "/assets/source-icons/sharepoint.svg", key: "sharepoint" },
  { name: "Microsoft OneDrive", description: "Folders and shared files", icon: "/assets/source-icons/onedrive.svg", key: "onedrive" },
  { name: "Microsoft Word", description: "Word policy documents", icon: "/assets/source-icons/word.svg", key: "word" },
  { name: "Microsoft Excel", description: "Workbooks and structured data", icon: "/assets/source-icons/excel.svg", key: "excel" },
  { name: "Microsoft PowerPoint", description: "Presentations and training", icon: "/assets/source-icons/powerpoint.svg", key: "powerpoint" },
  { name: "PDF / file upload", description: "Upload a local knowledge file", icon: "/assets/source-icons/pdf.svg", key: "upload" },
  { name: "Website", description: "Approved public web content", icon: "/assets/source-icons/website.svg", key: "website" },
];

export function AdminView() {
  const [connected, setConnected] = useState<string[]>(["copilot"]);
  const [runtimeReady, setRuntimeReady] = useState<boolean | null>(null);
  useEffect(() => { fetch("/api/admin/sources").then((response) => response.json()).then((value) => setRuntimeReady(Boolean(value.configured))).catch(() => setRuntimeReady(false)); }, []);
  function configure(key: string) { setConnected((current) => current.includes(key) ? current : [...current, key]); }
  return <section className="page-content admin-page">
    <div className="page-heading"><div><span className="eyebrow">KNOWLEDGE OPERATIONS</span><h2>Admin Dashboard</h2><p>Review integration readiness and prototype knowledge-source options.</p></div><span className="admin-avatar">AM</span></div>
    <div className="status-grid">
      <article className="stat-card"><span>Copilot Studio</span><strong>Configured</strong><p>Server-side Direct Line token exchange</p></article>
      <article className="stat-card"><span>Source management API</span><strong>{runtimeReady === null ? "Checking" : runtimeReady ? "Configured" : "Optional"}</strong><p>{runtimeReady ? "External source API available" : "Prototype selections stay in this browser"}</p></article>
      <article className="stat-card"><span>Available connectors</span><strong>{sourceTypes.length}</strong><p>Recognizable local product icons</p></article>
    </div>
    <div className="source-panel">
      <div className="panel-heading"><div><h3>Add a knowledge source</h3><p>Choose a source type. Demo selections are labelled honestly and do not perform ingestion.</p></div><span className="prototype-badge">Prototype</span></div>
      <div className="source-grid">{sourceTypes.map((source) => {
        const isConnected = connected.includes(source.key);
        return <article className="source-option" key={source.key}>
          <img src={source.icon} alt={`${source.name} logo`} width="48" height="48"/>
          <div><h4>{source.name}</h4><p>{source.description}</p></div>
          <button className={`source-add ${isConnected ? "is-configured" : ""}`} onClick={() => configure(source.key)} disabled={isConnected && source.key === "copilot"}>{isConnected ? <><CheckIcon size={15}/>{source.key === "copilot" ? "Connected" : "Prototype configured"}</> : <><PlusIcon size={15}/>Add source</>}</button>
        </article>;
      })}</div>
    </div>
    <div className="admin-callout"><img src="/assets/source-icons/copilot-studio.svg" alt="Copilot Studio logo" width="44" height="44"/><div><h3>Live answer path</h3><p>Browser questions use short-lived Direct Line conversation tokens. The Direct Line secret stays in the server environment and is never returned to this dashboard.</p></div></div>
  </section>;
}
