"use client";

import { useEffect, useState } from "react";
import { BotIcon, FileIcon } from "./icons";

const connectors = ["SharePoint", "OneDrive", "PDF / file upload", "Word", "Excel", "PowerPoint", "Website / URL"];

export function AdminView() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  useEffect(() => { fetch("/api/directline/status").then(r => r.json()).then(data => setConfigured(Boolean(data.configured))).catch(() => setConfigured(false)); }, []);
  return <section className="content-page">
    <div className="page-heading"><div><span className="eyebrow">Configuration overview</span><h1>Admin Dashboard</h1><p>Review the agent connection and simulated knowledge sources for this demo.</p></div></div>
    <div className="stats-grid">
      <article className="stat-card glass-card"><span>Agent connection</span><strong>{configured === null ? "Checking" : configured ? "Configured" : "Needs setup"}</strong><small>Copilot Studio via server-side Direct Line</small></article>
      <article className="stat-card glass-card"><span>Demo sources</span><strong>4</strong><small>Fictional files in the Knowledge Library</small></article>
      <article className="stat-card glass-card"><span>Secret exposure</span><strong>Server only</strong><small>Never sent in application code</small></article>
    </div>
    <div className="admin-grid">
      <article className="admin-card glass-card"><div className="admin-card-title"><BotIcon /><div><h2>Copilot Studio agent</h2><p>Live runtime configuration</p></div><span className={`status-pill ${configured ? "ok" : "warn"}`}>{configured ? "Connected" : "Not configured"}</span></div><p>Add <code>DIRECT_LINE_SECRET</code> to the Vercel project environment, then redeploy. The browser receives only a temporary conversation token.</p></article>
      <article className="admin-card glass-card"><div className="admin-card-title"><FileIcon /><div><h2>Add the first source</h2><p>Production-ready connection options</p></div></div><div className="connector-grid">{connectors.map(name => <button key={name} type="button" onClick={() => alert(`${name} is simulated in this hackathon dashboard. Configure the source in Copilot Studio for production.`)}><span>{name.slice(0, 2).toUpperCase()}</span>{name}</button>)}</div></article>
    </div>
  </section>;
}
