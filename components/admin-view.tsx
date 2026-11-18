"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckIcon, CloseIcon, PlusIcon } from "@/components/icons";

type ConnectorField = {
  name: string;
  label: string;
  type?: "text" | "url" | "file" | "select";
  placeholder?: string;
  accept?: string;
  options?: string[];
  help?: string;
};

type SourceType = {
  name: string;
  description: string;
  icon: string;
  key: string;
  fields: ConnectorField[];
};

const CONNECTED_KEY = "ask-revantage-demo-connectors-v2";
const sourceTypes: SourceType[] = [
  {
    name: "Copilot Studio", description: "Live knowledge-grounded agent", icon: "/assets/source-icons/copilot-studio.svg", key: "copilot",
    fields: [
      { name: "agentName", label: "Agent display name", placeholder: "Ask Revantage Bot" },
      { name: "environmentUrl", label: "Power Platform environment URL", type: "url", placeholder: "https://org.crm.dynamics.com", help: "Use the non-secret environment URL. The Direct Line secret remains in the server environment." },
    ],
  },
  {
    name: "Microsoft SharePoint", description: "Sites and document libraries", icon: "/assets/source-icons/sharepoint.svg", key: "sharepoint",
    fields: [
      { name: "siteUrl", label: "SharePoint site URL", type: "url", placeholder: "https://tenant.sharepoint.com/sites/People" },
      { name: "library", label: "Document library", placeholder: "Shared Documents" },
      { name: "folder", label: "Folder path (optional)", placeholder: "Policies/India" },
    ],
  },
  {
    name: "Microsoft OneDrive", description: "Folders and shared files", icon: "/assets/source-icons/onedrive.svg", key: "onedrive",
    fields: [
      { name: "folderUrl", label: "OneDrive folder URL", type: "url", placeholder: "https://tenant-my.sharepoint.com/..." },
      { name: "label", label: "Source label", placeholder: "Ask Revantage knowledge base" },
    ],
  },
  {
    name: "Microsoft Word", description: "Word policy documents", icon: "/assets/source-icons/word.svg", key: "word",
    fields: [
      { name: "file", label: "Word document", type: "file", accept: ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
      { name: "category", label: "Knowledge category", placeholder: "People policy" },
    ],
  },
  {
    name: "Microsoft Excel", description: "Workbooks and structured data", icon: "/assets/source-icons/excel.svg", key: "excel",
    fields: [
      { name: "file", label: "Excel workbook", type: "file", accept: ".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" },
      { name: "sheet", label: "Sheet or table name", placeholder: "Policy Register" },
    ],
  },
  {
    name: "Microsoft PowerPoint", description: "Presentations and training", icon: "/assets/source-icons/powerpoint.svg", key: "powerpoint",
    fields: [
      { name: "file", label: "PowerPoint presentation", type: "file", accept: ".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" },
      { name: "category", label: "Knowledge category", placeholder: "Policy training" },
    ],
  },
  {
    name: "PDF / file upload", description: "Upload a local knowledge file", icon: "/assets/source-icons/pdf.svg", key: "upload",
    fields: [
      { name: "file", label: "Knowledge file", type: "file", accept: ".pdf,.txt,.md,application/pdf,text/plain,text/markdown" },
      { name: "title", label: "Document title", placeholder: "Cab and transport policy" },
    ],
  },
  {
    name: "Website", description: "Approved public web content", icon: "/assets/source-icons/website.svg", key: "website",
    fields: [
      { name: "url", label: "Starting URL", type: "url", placeholder: "https://example.com/policies" },
      { name: "scope", label: "Import scope", type: "select", options: ["This page only", "This path and child pages", "Full approved domain"] },
    ],
  },
];

function readConnected() {
  try {
    const value = JSON.parse(localStorage.getItem(CONNECTED_KEY) || "[]");
    return Array.isArray(value) ? ["copilot", ...value.filter((item) => typeof item === "string" && item !== "copilot")] : ["copilot"];
  } catch { return ["copilot"]; }
}

export function AdminView() {
  const [connected, setConnected] = useState<string[]>(["copilot"]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [runtimeReady, setRuntimeReady] = useState<boolean | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setConnected(readConnected());
    fetch("/api/admin/sources", { cache: "no-store" }).then((response) => response.json()).then((value) => setRuntimeReady(Boolean(value.configured))).catch(() => setRuntimeReady(false));
  }, []);

  const selected = useMemo(() => sourceTypes.find((source) => source.key === selectedKey) || null, [selectedKey]);

  function selectSource(key: string) {
    setSelectedKey(key);
    setStatus("");
    requestAnimationFrame(() => document.getElementById("connector-form")?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  }

  function savePrototype(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const next = connected.includes(selected.key) ? connected : [...connected, selected.key];
    setConnected(next);
    localStorage.setItem(CONNECTED_KEY, JSON.stringify(next));
    setStatus(`${selected.name} is marked as configured for this hackathon browser. No credentials or files were uploaded.`);
  }

  return <section className="page-content admin-page">
    <div className="page-heading"><div><span className="eyebrow">KNOWLEDGE OPERATIONS</span><h2>Admin Dashboard</h2><p>Review integration readiness and configure prototype knowledge-source connections.</p></div><span className="admin-avatar">AM</span></div>
    <div className="status-grid">
      <article className="stat-card"><span>Copilot Studio</span><strong>Configured</strong><p>Server-started Direct Line conversation</p></article>
      <article className="stat-card"><span>Source management API</span><strong>{runtimeReady === null ? "Checking" : runtimeReady ? "Configured" : "Prototype"}</strong><p>{runtimeReady ? "External source API available" : "Connector choices are simulated locally"}</p></article>
      <article className="stat-card"><span>Available connectors</span><strong>{sourceTypes.length}</strong><p>Local Microsoft-style product icons</p></article>
    </div>
    <div className="source-panel">
      <div className="panel-heading"><div><h3>Add a knowledge source</h3><p>Select a connector to open its setup form. Hackathon saves are clearly marked as simulated.</p></div><span className="prototype-badge">Hackathon prototype</span></div>
      <div className="source-grid">{sourceTypes.map((source) => {
        const isConnected = connected.includes(source.key);
        const isSelected = selectedKey === source.key;
        return <article className={`source-option ${isSelected ? "is-selected" : ""}`} key={source.key}>
          <img src={source.icon} alt={`${source.name} logo`} width="48" height="48"/>
          <div><h4>{source.name}</h4><p>{source.description}</p></div>
          <button className={`source-add ${isConnected ? "is-configured" : ""}`} type="button" onClick={() => selectSource(source.key)} aria-expanded={isSelected} aria-controls="connector-form">
            {isConnected ? <><CheckIcon size={15}/>{source.key === "copilot" ? "View setup" : "Edit setup"}</> : <><PlusIcon size={15}/>Add source</>}
          </button>
        </article>;
      })}</div>

      {selected && <form className="connector-form" id="connector-form" onSubmit={savePrototype} aria-labelledby="connector-form-title">
        <div className="connector-form-heading">
          <div className="connector-form-product"><img src={selected.icon} alt="" width="42" height="42"/><div><span className="eyebrow">CONNECTOR SETUP</span><h3 id="connector-form-title">Connect {selected.name}</h3></div></div>
          <button className="form-close" type="button" onClick={() => setSelectedKey(null)} aria-label={`Close ${selected.name} setup`}><CloseIcon size={17}/></button>
        </div>
        <div className="field-grid">
          {selected.fields.map((field) => <div className="connector-field" key={field.name}>
            <label htmlFor={`${selected.key}-${field.name}`}>{field.label}</label>
            {field.type === "select" ? <select id={`${selected.key}-${field.name}`} name={field.name} required defaultValue="">
              <option value="" disabled>Select an option</option>
              {field.options?.map((option) => <option value={option} key={option}>{option}</option>)}
            </select> : <input id={`${selected.key}-${field.name}`} name={field.name} type={field.type || "text"} placeholder={field.placeholder} accept={field.accept} required={!field.label.includes("optional")}/>} 
            {field.help && <small>{field.help}</small>}
          </div>)}
        </div>
        <div className="connector-security-note"><strong>No secrets in the browser.</strong> This form records only a simulated connector state for the hackathon. Production credentials, consent, file transfer and ingestion must run through approved server-side services.</div>
        <div className="connector-actions"><button className="button ghost" type="button" onClick={() => setSelectedKey(null)}>Cancel</button><button className="connector-save" type="submit">Save prototype configuration</button></div>
        {status && <p className="connection-status" role="status"><CheckIcon size={15}/>{status}</p>}
      </form>}
    </div>
    <div className="admin-callout"><img src="/assets/source-icons/copilot-studio.svg" alt="Copilot Studio logo" width="44" height="44"/><div><h3>Live answer path</h3><p>Browser questions use a short-lived token paired to a server-started Direct Line conversation. The Direct Line secret stays in the server environment.</p></div></div>
  </section>;
}
