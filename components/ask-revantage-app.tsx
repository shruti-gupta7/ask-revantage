"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { ROUTING_CONTACTS, routeForQuery, teamsChatUrl, type RoutingContact } from "@/data/routing";
import { createDirectLineSession, isUnsupportedCopilotReply, sendToCopilot, type CopilotCitation, type DirectLineSession } from "@/lib/copilot-direct-line";

type View = "ask" | "knowledge" | "people" | "admin";
type Message = {
  id: string;
  role: "assistant" | "user";
  text: string;
  sources?: CopilotCitation[];
  route?: RoutingContact;
  question?: string;
};
type RequestItem = {
  id: string;
  question: string;
  team: string;
  contact: string;
  created: string;
  status: "Open" | "In progress" | "Resolved";
};

type DataSourceType = "Copilot Studio agent" | "Microsoft SharePoint" | "Microsoft OneDrive" | "PDF / file upload" | "Microsoft Word" | "Microsoft Excel" | "Microsoft PowerPoint" | "Website / URL";
type DataSourceStatus = "Configured" | "Checking" | "Paused";
type DataSource = {
  id: string;
  name: string;
  type: DataSourceType;
  location: string;
  scope: string;
  status: DataSourceStatus;
  enabled: boolean;
  created: string;
  lastChecked?: string;
};
type IntegrationStatus = {
  agent: { provider: string; configured: boolean; connectionMethod: string | null };
  sources: { persistence: string; apiConfigured: boolean };
};
type Theme = "light" | "dark";
type SessionPersona = { name: string; role: string; avatar: string };

type IconName = "bot" | "book" | "route" | "admin" | "send" | "home" | "search" | "external" | "download" | "copy" | "check" | "menu" | "close" | "shield" | "clock" | "chevron" | "user" | "plus" | "database" | "refresh" | "trash" | "pause" | "play" | "folder" | "file" | "filePdf" | "fileWord" | "fileExcel" | "filePowerpoint" | "cloud" | "sharepoint" | "link" | "sun" | "moon";

const iconPaths: Record<IconName, React.ReactNode> = {
  bot: <><rect x="4" y="7" width="16" height="12" rx="4"/><path d="M9 12h.01M15 12h.01M9 16h6M12 7V4M9 4h6"/></>,
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></>,
  route: <><circle cx="6" cy="5" r="2"/><circle cx="18" cy="19" r="2"/><path d="M8 5h5a3 3 0 0 1 3 3v8"/><path d="m13 13 3 3 3-3"/></>,
  admin: <><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
  send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  external: <><path d="M14 3h7v7M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></>,
  download: <><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  chevron: <path d="m9 18 6-6-6-6"/>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  database: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></>,
  refresh: <><path d="M20 11a8 8 0 0 0-14.8-4L3 10"/><path d="M3 4v6h6"/><path d="M4 13a8 8 0 0 0 14.8 4L21 14"/><path d="M21 20v-6h-6"/></>,
  trash: <><path d="M3 6h18"/><path d="M8 6V4h8v2M19 6l-1 15H6L5 6"/><path d="M10 11v5M14 11v5"/></>,
  pause: <><path d="M9 5v14M15 5v14"/></>,
  play: <path d="m8 5 11 7-11 7Z"/>,
  folder: <path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>,
  file: <><path d="M6 2h8l4 4v16H6Z"/><path d="M14 2v5h5"/></>,
  filePdf: <><path d="M6 2h8l4 4v16H6Z"/><path d="M14 2v5h5"/><path d="M8 16h8M8 12h5"/></>,
  fileWord: <><path d="M6 2h8l4 4v16H6Z"/><path d="M14 2v5h5"/><path d="m8 11 1.5 6 2.5-5 2.5 5L16 11"/></>,
  fileExcel: <><path d="M6 2h8l4 4v16H6Z"/><path d="M14 2v5h5"/><path d="m9 11 6 6M15 11l-6 6"/></>,
  filePowerpoint: <><path d="M6 2h8l4 4v16H6Z"/><path d="M14 2v5h5"/><path d="M9 17v-6h3a2 2 0 1 1 0 4H9"/></>,
  cloud: <path d="M7 18h10a4 4 0 0 0 .8-7.9A6 6 0 0 0 6.3 8.5 4.5 4.5 0 0 0 7 18Z"/>,
  sharepoint: <><circle cx="8" cy="8" r="4"/><circle cx="16" cy="6" r="3"/><circle cx="16" cy="16" r="4"/><path d="M11 9.5 13.5 8M10.5 11l3 3"/></>,
  link: <><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1"/></>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>,
};

const DATA_SOURCE_KEY = "ask-revantage.data-sources.v1";
const connectorOptions: Array<{ type: DataSourceType; icon: IconName; description: string }> = [
  { type: "Copilot Studio agent", icon: "bot", description: "Published agent and directly uploaded knowledge" },
  { type: "Microsoft SharePoint", icon: "sharepoint", description: "Sites, libraries, and approved folders" },
  { type: "Microsoft OneDrive", icon: "cloud", description: "OneDrive folders and document links" },
  { type: "PDF / file upload", icon: "filePdf", description: "PDF and other approved file uploads" },
  { type: "Microsoft Word", icon: "fileWord", description: "DOC and DOCX documents" },
  { type: "Microsoft Excel", icon: "fileExcel", description: "XLS and XLSX workbooks" },
  { type: "Microsoft PowerPoint", icon: "filePowerpoint", description: "PPT and PPTX presentations" },
  { type: "Website / URL", icon: "link", description: "Approved public or internal web content" },
];
const normalPersona: SessionPersona = { name: "Shruti Gupta", role: "User", avatar: "/assets/avatars/shruti-gupta.jpg" };
const adminPersonas: SessionPersona[] = [
  { name: "Elena Park", role: "Admin user", avatar: "/assets/avatars/elena-park.svg" },
  { name: "Marcus Reed", role: "Admin user", avatar: "/assets/avatars/marcus-reed.svg" },
  { name: "Nadia Iqbal", role: "Admin user", avatar: "/assets/avatars/nadia-iqbal.svg" },
];

function connectorFor(type: DataSourceType) {
  return connectorOptions.find((option) => option.type === type) || connectorOptions[0];
}

function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>;
}

const starterQuestions = [
  { label: "Cab & transport", question: "How do I book a cab for a late shift?" },
  { label: "People & leave", question: "How many annual leave days can I carry forward?" },
  { label: "Expenses", question: "Which travel expenses can I reimburse?" },
];

const viewPaths: Record<View, string> = {
  ask: "/",
  knowledge: "/knowledge",
  people: "/people",
  admin: "/admin",
};

function newId(prefix: string) {
  return `${prefix}-${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;
}

function validDocumentUrl(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function sourceFileType(source: CopilotCitation): { icon: IconName; label: string; className: string } {
  const value = `${source.mimeType || ""} ${source.title} ${source.url || ""}`.toLowerCase().split("?")[0];
  if (/folder|directory/.test(value)) return { icon: "folder", label: "Folder", className: "bg-[#F2ECE8] text-[#8E695B]" };
  if (/pdf/.test(value)) return { icon: "filePdf", label: "PDF", className: "bg-[#F2ECE8] text-[#8E695B]" };
  if (/word|docx?|msword/.test(value)) return { icon: "fileWord", label: "Word", className: "bg-[#E8EDF2] text-[#4C759D]" };
  if (/excel|xlsx?|spreadsheet/.test(value)) return { icon: "fileExcel", label: "Excel", className: "bg-[#F1F1F1] text-[#18324D]" };
  if (/powerpoint|pptx?|presentation/.test(value)) return { icon: "filePowerpoint", label: "PowerPoint", className: "bg-[#F2ECE8] text-[#8E695B]" };
  return { icon: "file", label: "File", className: "bg-[#E8EDF2] text-[#4C759D]" };
}

export default function AskRevantageApp({ initialView = "ask" }: { initialView?: View }) {
  const router = useRouter();
  const [view, setView] = useState<View>(initialView);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hello, I’m Ask Revant Bot. Ask me about workplace policies, cab bookings, leave, expenses, IT access, or office services. I’ll use the published Copilot Studio knowledge and show its citations when available.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [directoryPeople, setDirectoryPeople] = useState<RoutingContact[]>(ROUTING_CONTACTS);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus | null>(null);
  const [sourceFormOpen, setSourceFormOpen] = useState(false);
  const [sourceName, setSourceName] = useState("");
  const [sourceType, setSourceType] = useState<DataSourceType>("Copilot Studio agent");
  const [sourceLocation, setSourceLocation] = useState("");
  const [sourceScope, setSourceScope] = useState("");
  const [documentQuery, setDocumentQuery] = useState("");
  const [peopleQuery, setPeopleQuery] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [notice, setNotice] = useState("");
  const [theme, setTheme] = useState<Theme>("light");
  const [adminPersona, setAdminPersona] = useState<SessionPersona>(adminPersonas[0]);
  const endRef = useRef<HTMLDivElement | null>(null);
  const directLineRef = useRef<DirectLineSession | null>(null);

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("ask-revantage.theme") as Theme | null;
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const nextTheme = savedTheme === "dark" || savedTheme === "light" ? savedTheme : preferred;
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;

    const savedAdminId = sessionStorage.getItem("ask-revantage.admin-persona");
    const selected = adminPersonas.find((persona) => persona.name === savedAdminId) || adminPersonas[Math.floor(Math.random() * adminPersonas.length)];
    setAdminPersona(selected);
    sessionStorage.setItem("ask-revantage.admin-persona", selected.name);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ask-revantage.requests");
      if (saved) setRequests(JSON.parse(saved));
    } catch {
      setRequests([]);
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DATA_SOURCE_KEY);
      setDataSources(saved ? JSON.parse(saved) : []);
    } catch {
      setDataSources([]);
    }
  }, []);

  useEffect(() => {
    if (view !== "admin") return;
    let active = true;
    fetch("/api/admin/status", { cache: "no-store" })
      .then((response) => response.json())
      .then(async (status: IntegrationStatus) => {
        if (!active) return;
        setIntegrationStatus(status);
        if (status.sources.apiConfigured) {
          const response = await fetch("/api/admin/sources", { cache: "no-store" });
          if (!response.ok) throw new Error("Configured source service could not be read.");
          const payload = await response.json();
          if (active) setDataSources(Array.isArray(payload) ? payload : payload.sources || []);
        }
      })
      .catch(() => { if (active) setIntegrationStatus(null); });
    return () => { active = false; };
  }, [view]);

  useEffect(() => {
    if (view !== "people") return;
    let active = true;
    fetch("/api/people", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (active && payload.configured && Array.isArray(payload.people) && payload.people.length) setDirectoryPeople(payload.people);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [view]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const conversationSources = useMemo(() => {
    const normalized = documentQuery.trim().toLowerCase();
    const unique = new Map<string, CopilotCitation>();
    for (const message of messages) {
      for (const source of message.sources || []) unique.set(`${source.title}|${source.url || source.id}`, source);
    }
    const sources = [...unique.values()];
    if (!normalized) return sources;
    return sources.filter((source) => `${source.title} ${source.description || ""} ${source.provider || ""}`.toLowerCase().includes(normalized));
  }, [documentQuery, messages]);

  const filteredPeople = useMemo(() => {
    const normalized = peopleQuery.trim().toLowerCase();
    if (!normalized) return directoryPeople;
    return directoryPeople.filter((person) => `${person.name} ${person.title} ${person.department} ${person.location} ${(person.expertise || []).join(" ")}`.toLowerCase().includes(normalized));
  }, [directoryPeople, peopleQuery]);

  const sessionPersona = view === "admin" ? adminPersona : normalPersona;

  function navigate(next: View) {
    setView(next);
    setMobileOpen(false);
    router.push(viewPaths[next]);
  }

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("ask-revantage.theme", next);
  }

  async function ask(override?: string) {
    const text = (override ?? question).trim();
    if (!text || loading) return;
    setQuestion("");
    setView("ask");
    if (view !== "ask") router.push("/");
    setMessages((current) => [...current, { id: newId("message"), role: "user", text }]);
    setLoading(true);

    try {
      if (!directLineRef.current) directLineRef.current = await createDirectLineSession();
      const result = await sendToCopilot(directLineRef.current, text);
      const unsupported = isUnsupportedCopilotReply(result.text, result.citations);
      setMessages((current) => [
        ...current,
        {
          id: newId("message"),
          role: "assistant",
          text: result.text,
          sources: result.citations,
          route: unsupported ? routeForQuery(text, directoryPeople) : undefined,
          question: text,
        },
      ]);
    } catch (error) {
      directLineRef.current = null;
      setMessages((current) => [
        ...current,
        {
          id: newId("message"),
          role: "assistant",
          text: error instanceof Error ? error.message : "Ask Revant Bot could not retrieve an answer. You can send the question to the relevant support team.",
          route: routeForQuery(text, directoryPeople),
          question: text,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    ask();
  }

  function createRequest(route: RoutingContact, originalQuestion: string) {
    const item: RequestItem = {
      id: `AR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      question: originalQuestion,
      team: route.department,
      contact: route.name,
      created: new Date().toISOString(),
      status: "Open",
    };
    const next = [item, ...requests];
    setRequests(next);
    localStorage.setItem("ask-revantage.requests", JSON.stringify(next));
    setNotice(`${item.id} created and routed to ${route.department}.`);
  }

  function saveDataSources(next: DataSource[]) {
    setDataSources(next);
    localStorage.setItem(DATA_SOURCE_KEY, JSON.stringify(next));
  }

  async function refreshRemoteSources() {
    const response = await fetch("/api/admin/sources", { cache: "no-store" });
    if (!response.ok) throw new Error("The configured source service could not be refreshed.");
    const payload = await response.json();
    setDataSources(Array.isArray(payload) ? payload : payload.sources || []);
  }

  async function addDataSource(event: FormEvent) {
    event.preventDefault();
    const name = sourceName.trim();
    const location = sourceLocation.trim();
    if (!name || !location) return;
    const item: DataSource = {
      id: newId("source"),
      name,
      type: sourceType,
      location,
      scope: sourceScope.trim(),
      status: "Configured",
      enabled: true,
      created: new Date().toISOString(),
    };
    if (integrationStatus?.sources.apiConfigured) {
      const response = await fetch("/api/admin/sources", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
      if (!response.ok) { setNotice("The configured source service could not save this connection."); return; }
      await refreshRemoteSources();
    } else {
      saveDataSources([item, ...dataSources]);
    }
    setSourceName("");
    setSourceLocation("");
    setSourceScope("");
    setSourceType("Copilot Studio agent");
    setSourceFormOpen(false);
    setNotice(`${item.name} added to the configured source workspace.`);
  }

  async function toggleDataSource(id: string) {
    const selected = dataSources.find((source) => source.id === id);
    if (!selected) return;
    const next = dataSources.map((source) => source.id === id ? { ...source, enabled: !source.enabled, status: (!source.enabled ? "Configured" : "Paused") as DataSourceStatus } : source);
    if (integrationStatus?.sources.apiConfigured) {
      const updated = next.find((source) => source.id === id);
      const response = await fetch(`/api/admin/sources?id=${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
      if (!response.ok) { setNotice("The configured source service could not update this connection."); return; }
      await refreshRemoteSources();
    } else saveDataSources(next);
  }

  async function checkDataSource(id: string) {
    if (integrationStatus?.sources.apiConfigured) {
      const response = await fetch(`/api/admin/sources?id=${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "check" }) });
      if (!response.ok) { setNotice("The configured source service could not check this connection."); return; }
      await refreshRemoteSources();
      setNotice("Connection check requested from the configured source service.");
      return;
    }
    const started = dataSources.map((source) => source.id === id ? { ...source, status: "Checking" as DataSourceStatus } : source);
    saveDataSources(started);
    window.setTimeout(() => {
      const current = JSON.parse(localStorage.getItem(DATA_SOURCE_KEY) || "[]") as DataSource[];
      const completed = current.map((source) => source.id === id ? { ...source, status: "Configured" as DataSourceStatus, lastChecked: new Date().toISOString() } : source);
      saveDataSources(completed);
      setNotice("Prototype configuration review completed. No live ingestion was performed.");
    }, 650);
  }

  async function removeDataSource(id: string) {
    const source = dataSources.find((item) => item.id === id);
    if (integrationStatus?.sources.apiConfigured) {
      const response = await fetch(`/api/admin/sources?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) { setNotice("The configured source service could not remove this connection."); return; }
      await refreshRemoteSources();
    } else saveDataSources(dataSources.filter((item) => item.id !== id));
    setNotice(source ? `${source.name} removed from the configured source workspace.` : "Source removed.");
  }

  async function copyAnswer(message: Message) {
    await navigator.clipboard.writeText(message.text);
    setCopiedId(message.id);
    window.setTimeout(() => setCopiedId(""), 1500);
  }

  function startNewConversation() {
    directLineRef.current = null;
    setMessages([{ id: newId("welcome"), role: "assistant", text: "New conversation started with Ask Revant Bot. What would you like to know?" }]);
  }

  return (
    <main className="app-shell min-h-screen text-[#031730]">
      {notice && <div role="status" className="glass-dark fixed right-5 top-5 z-[80] max-w-sm rounded-xl px-4 py-3 text-sm text-white">{notice}</div>}

      <header className="glass-nav fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between px-4 lg:hidden">
        <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-[#031730]" aria-label="Open navigation"><Icon name="menu" /></button>
        <Image src="/assets/ask-revantage-logo.jpeg" alt="Ask Revantage" width={180} height={100} className="h-12 w-auto object-contain" priority />
        <div className="flex items-center gap-2"><ThemeToggle theme={theme} onToggle={toggleTheme}/><Image src={sessionPersona.avatar} alt={`${sessionPersona.name} avatar`} width={36} height={36} className="h-9 w-9 rounded-full border-2 border-white object-cover shadow"/></div>
      </header>

      <aside className={`glass-sidebar fixed inset-y-0 left-0 z-[60] flex w-[286px] flex-col transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[132px] items-center justify-center border-b border-black/10 px-5">
          <Image src="/assets/ask-revantage-logo.jpeg" alt="Ask Revantage — One Question. One Place. One Answer." width={250} height={140} className="h-[108px] w-[240px] object-contain" priority />
          <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 rounded-lg p-2 text-[#4C759D] lg:hidden" aria-label="Close navigation"><Icon name="close" /></button>
        </div>

        <nav className="flex-1 px-4 py-6" aria-label="Main navigation">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E695B]">Workspace</p>
          <NavButton active={view === "ask"} icon="bot" label="Ask Revant Bot" onClick={() => navigate("ask")} />
          <NavButton active={view === "knowledge"} icon="book" label="Knowledge Library" count={conversationSources.length || undefined} onClick={() => navigate("knowledge")} />
          <NavButton active={view === "people"} icon="user" label="People Directory" count={directoryPeople.length} onClick={() => navigate("people")} />
          <div className="my-6 border-t border-black/10" />
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E695B]">Manage</p>
          <NavButton active={view === "admin"} icon="admin" label="Admin Dashboard" count={requests.length || undefined} onClick={() => navigate("admin")} />
        </nav>

        <div className="flex items-center gap-3 border-t border-black/10 px-5 py-4">
          <Image src={sessionPersona.avatar} alt={`${sessionPersona.name} avatar`} width={40} height={40} className="h-10 w-10 rounded-full border-2 border-white object-cover shadow"/>
          <div className="min-w-0"><p className="truncate text-sm font-bold">{sessionPersona.name}</p><p className="truncate text-xs text-[#667085]">{sessionPersona.role}</p></div>
        </div>
      </aside>

      {mobileOpen && <button className="fixed inset-0 z-[55] bg-[#031730]/50 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" />}

      <section className="min-h-screen pt-16 lg:ml-[286px] lg:pt-0">
        {view === "ask" && (
          <div className="flex min-h-screen flex-col">
            <PageHeader eyebrow="Employee knowledge" title="Ask Revantage" description="Clear answers, visible sources, and a direct path to human support." theme={theme} onToggleTheme={toggleTheme} />
            <div className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
              <section className="glass-panel reveal reveal-delay-1 flex min-h-[680px] flex-col overflow-hidden rounded-[24px]">
                <div className="glass-divider flex items-center justify-between px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#031730] text-[#CFE4F8]"><Icon name="bot" /></div>
                    <div><h2 className="font-serif text-lg">Ask Revant Bot</h2><p className="text-xs text-[#667085]">Live answers from the published Copilot Studio agent</p></div>
                  </div>
                  <button onClick={startNewConversation} className="rounded-lg border border-black/10 px-3 py-2 text-xs font-bold text-[#4C759D] hover:bg-[#F1F1F1]">New conversation</button>
                </div>

                <div className="chat-scroll flex-1 space-y-6 overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(207,228,248,0.42),transparent_28%)] px-4 py-7 sm:px-8">
                  {messages.map((message) => (
                    <article key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      {message.role === "assistant" && <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#031730] text-[#CFE4F8]"><Icon name="bot" className="h-4 w-4" /></div>}
                      <div className={`max-w-[760px] ${message.role === "user" ? "rounded-2xl rounded-br-sm bg-[#18324D] px-5 py-3.5 text-white" : "min-w-0"}`}>
                        {message.role === "assistant" && <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8E695B]">Ask Revant Bot</p>}
                        {message.role === "user" && <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/65">Shruti Gupta</p>}
                        <p className={`whitespace-pre-wrap text-sm leading-6 ${message.role === "assistant" ? "text-[#25364A]" : "text-white"}`}>{message.text}</p>

                        {message.role === "assistant" && Boolean(message.sources?.length) && (
                          <div className="mt-4 space-y-3" aria-label="Supporting sources">
                            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#4C759D]"><Icon name="book" className="h-4 w-4" />Supporting sources</p>
                            {message.sources!.map((source, index) => {
                              const documentUrl = validDocumentUrl(source.url);
                              const fileType = sourceFileType(source);
                              return <article key={source.id} className="glass-inset overflow-hidden rounded-2xl"><div className="p-4"><div className="flex items-start gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${fileType.className}`}><Icon name={fileType.icon} className="h-5 w-5"/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-serif text-base text-[#031730]">{source.title}</h3><span className="rounded-full bg-white/60 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#667085]">{fileType.label}</span></div>{source.provider && <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#4C759D]">{source.provider}</p>}{source.description && <p className="mt-2 text-xs leading-5 text-[#667085]">{source.description}</p>}</div><span className="text-[10px] font-bold text-[#8E695B]">{index + 1}</span></div><div className="mt-4 flex flex-wrap gap-2">{documentUrl && <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-[#031730] px-3 py-2 text-xs font-bold text-white"><Icon name="external" className="h-3.5 w-3.5" />Open</a>}{documentUrl && <a href={documentUrl} download={source.downloadName || true} className="glass-button inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-[#18324D]"><Icon name="download" className="h-3.5 w-3.5" />Download</a>}{!documentUrl && <span className="text-[11px] text-[#667085]">Document link not available</span>}</div></div></article>;
                            })}
                            <button onClick={() => copyAnswer(message)} className="glass-button inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-[#4C759D]"><Icon name={copiedId === message.id ? "check" : "copy"} className="h-3.5 w-3.5" />{copiedId === message.id ? "Copied" : "Copy answer"}</button>
                          </div>
                        )}

                        {message.role === "assistant" && message.route && (
                          <RouteResult contact={message.route} onCreate={() => createRequest(message.route!, message.question || "Support requested")} />
                        )}
                      </div>
                      {message.role === "user" && <Image src={normalPersona.avatar} alt="Shruti Gupta avatar" width={36} height={36} className="mt-1 h-9 w-9 shrink-0 rounded-full border-2 border-white object-cover shadow"/>}
                    </article>
                  ))}
                  {messages.length === 1 && !loading && <div className="ml-12 flex flex-wrap gap-2" aria-label="Three suggested prompts">{starterQuestions.map((starter) => <button key={starter.question} onClick={() => ask(starter.question)} className="glass-button inline-flex items-center rounded-full px-4 py-2.5 text-left text-xs font-bold text-[#18324D] transition hover:-translate-y-0.5"><span>{starter.question}</span><span className="sr-only">{starter.label}</span></button>)}</div>}
                  {loading && <div className="flex gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#031730] text-[#CFE4F8]"><Icon name="bot" className="h-4 w-4" /></div><div className="flex items-center gap-1.5 rounded-2xl bg-[#F1F1F1] px-4 py-3" role="status" aria-label="Ask Revant Bot is typing"><span className="thinking-dot"/><span className="thinking-dot"/><span className="thinking-dot"/></div></div>}
                  <div ref={endRef} />
                </div>

                <div className="glass-composer p-4 sm:p-5">
                  <form onSubmit={submit} className="glass-input mx-auto flex max-w-4xl items-end gap-2 rounded-2xl p-2 focus-within:ring-4 focus-within:ring-[#CFE4F8]/60">
                    <textarea value={question} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setQuestion(event.target.value)} onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); ask(); } }} rows={1} placeholder="Ask about leave, cabs, expenses, access, or office services…" className="min-h-12 flex-1 resize-none bg-transparent px-3 py-3 text-sm leading-6 outline-none placeholder:text-[#98A2B3]" aria-label="Ask a workplace question" />
                    <button type="submit" disabled={!question.trim() || loading} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#031730] text-white transition hover:bg-[#18324D] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send question"><Icon name="send" /></button>
                  </form>
                  <div className="mx-auto mt-2 flex max-w-4xl items-center justify-between gap-4 text-[10px] text-[#667085]"><span className="flex items-center gap-1.5"><Icon name="shield" className="h-3.5 w-3.5" />Answers show the source when available</span><span className="hidden sm:inline">Enter to send · Shift + Enter for a new line</span></div>
                </div>
              </section>
            </div>
          </div>
        )}

        {view === "knowledge" && (
          <>
            <PageHeader eyebrow="Knowledge Library" title="Ask Revantage - Hackathon Knowledge Base" description="A clean view of the real document citations returned by the published Copilot Studio agent." theme={theme} onToggleTheme={toggleTheme} />
            <div className="mx-auto max-w-[1120px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              <div className="glass-panel reveal mb-5 flex flex-col justify-between gap-4 rounded-[22px] p-5 sm:flex-row sm:items-center"><div><p className="font-serif text-xl">{conversationSources.length} document{conversationSources.length === 1 ? "" : "s"} in this conversation</p><p className="mt-1 text-sm text-[#667085]">Links are shown only when Copilot Studio returns a valid document URL.</p></div><label className="flex h-11 min-w-0 items-center gap-2 rounded-xl border border-black/10 bg-white/65 px-3 sm:w-80"><Icon name="search" className="h-4 w-4 text-[#4C759D]"/><input value={documentQuery} onChange={(event: ChangeEvent<HTMLInputElement>) => setDocumentQuery(event.target.value)} placeholder="Search documents" className="w-full bg-transparent text-sm outline-none" aria-label="Search the Knowledge Library"/></label></div>
              {conversationSources.length === 0 ? <div className="glass-panel reveal flex min-h-[360px] flex-col items-center justify-center rounded-[22px] px-6 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8EDF2] text-[#4C759D]"><Icon name="folder" /></div><h2 className="mt-4 font-serif text-2xl">No cited documents yet</h2><p className="mt-2 max-w-lg text-sm leading-6 text-[#667085]">Ask a question in the chat. Documents returned from Ask Revantage - Hackathon Knowledge Base will appear here from live Copilot citation metadata.</p><button onClick={() => navigate("ask")} className="mt-4 rounded-xl bg-[#031730] px-4 py-2.5 text-xs font-bold text-white">Open Ask Revant Bot</button></div> : <div className="glass-panel reveal overflow-hidden rounded-[22px]"><div className="hidden grid-cols-[minmax(0,1fr)_120px_180px] gap-4 border-b border-black/10 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#667085] sm:grid"><span>Document</span><span>Type</span><span className="text-right">Actions</span></div><div className="divide-y divide-black/10">{conversationSources.map((source) => { const documentUrl = validDocumentUrl(source.url); const fileType = sourceFileType(source); return <article key={source.id} className="grid gap-4 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_120px_180px] sm:items-center sm:px-6"><div className="flex min-w-0 items-start gap-3"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${fileType.className}`}><Icon name={fileType.icon} className="h-5 w-5"/></span><div className="min-w-0"><h2 className="truncate font-serif text-base" title={source.title}>{source.title}</h2>{source.provider && <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-wider text-[#4C759D]">{source.provider}</p>}{source.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#667085]">{source.description}</p>}</div></div><span className="w-fit rounded-full bg-white/60 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#667085]">{fileType.label}</span><div className="flex flex-wrap gap-2 sm:justify-end">{documentUrl ? <><a href={documentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-[#031730] px-3 py-2 text-xs font-bold text-white"><Icon name="external" className="h-3.5 w-3.5"/>Open</a><a href={documentUrl} download={source.downloadName || true} className="glass-button inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-[#18324D]"><Icon name="download" className="h-3.5 w-3.5"/>Download</a></> : <span className="text-[11px] text-[#667085]">Link unavailable</span>}</div></article>; })}</div></div>}
            </div>
          </>
        )}

        {view === "people" && (
          <>
            <PageHeader eyebrow="Human support" title="People Directory" description="Find a fictional demo contact by name, department, location, or area of expertise." theme={theme} onToggleTheme={toggleTheme} />
            <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              <div className="glass-panel reveal mb-6 flex flex-col justify-between gap-4 rounded-[22px] p-5 sm:flex-row sm:items-center"><div><p className="font-serif text-xl">{filteredPeople.length} fictional contact{filteredPeople.length === 1 ? "" : "s"}</p><p className="mt-1 text-sm text-[#667085]">Demo profiles only. Replace them dynamically with approved directory data for production.</p></div><label className="flex h-11 min-w-0 items-center gap-2 rounded-xl border border-black/10 bg-white/65 px-3 sm:w-96"><Icon name="search" className="h-4 w-4 text-[#4C759D]"/><input value={peopleQuery} onChange={(event: ChangeEvent<HTMLInputElement>) => setPeopleQuery(event.target.value)} placeholder="Search people, teams, or expertise" className="w-full bg-transparent text-sm outline-none" aria-label="Search the People Directory"/></label></div>
              {filteredPeople.length ? <div className="grid gap-4 md:grid-cols-2">{filteredPeople.map((contact) => <ContactCard key={contact.id} contact={contact} />)}</div> : <div className="glass-panel reveal flex min-h-[280px] flex-col items-center justify-center rounded-[22px] px-6 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8EDF2] text-[#4C759D]"><Icon name="user"/></div><h2 className="mt-4 font-serif text-xl">No people match that search</h2><p className="mt-2 text-sm text-[#667085]">Try a name, department, location, or expertise keyword.</p></div>}
            </div>
          </>
        )}

        {view === "admin" && (
          <>
            <PageHeader eyebrow="Administration" title="Admin Dashboard" description="Configure prototype source connections and review live Copilot Studio runtime status." theme={theme} onToggleTheme={toggleTheme} />
            <div className="mx-auto max-w-[1260px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <AdminMetric label="Configured sources" value={dataSources.length.toString()} detail="Workspace total"/>
                <AdminMetric label="Active connections" value={dataSources.filter((source) => source.enabled).length.toString()} detail="Enabled now"/>
                <AdminMetric label="Agent integration" value={integrationStatus?.agent.configured ? "On" : "Off"} detail={integrationStatus?.agent.connectionMethod || "Not configured"}/>
                <AdminMetric label="Persistence" value={integrationStatus?.sources.apiConfigured ? "API" : "Local"} detail={integrationStatus?.sources.persistence || "Checking"}/>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
                <section className="glass-panel reveal overflow-hidden rounded-[22px]">
                  <div className="flex flex-col justify-between gap-4 border-b border-black/10 px-6 py-5 sm:flex-row sm:items-center">
                    <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8E695B]">Dynamic knowledge</p><h2 className="mt-1 font-serif text-2xl">Configured data sources</h2><p className="mt-1 text-xs leading-5 text-[#667085]">Only sources added to this workspace appear here. No source records are seeded in the admin panel.</p></div>
                    <button onClick={() => setSourceFormOpen((open) => !open)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#031730] px-4 py-3 text-xs font-bold text-white"><Icon name={sourceFormOpen ? "close" : "plus"} className="h-4 w-4"/>{sourceFormOpen ? "Close form" : "Add data source"}</button>
                  </div>

                  {sourceFormOpen && (
                    <form onSubmit={addDataSource} className="glass-inset m-5 grid gap-4 rounded-2xl p-5 sm:grid-cols-2" aria-label="Add a data source">
                      <fieldset className="sm:col-span-2"><legend className="text-xs font-bold text-[#25364A]">Choose a source or provider</legend><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{connectorOptions.map((option) => <button key={option.type} type="button" onClick={() => setSourceType(option.type)} className={`rounded-xl border p-3 text-left transition ${sourceType === option.type ? "border-[#4C759D] bg-[#E8EDF2] shadow-sm" : "border-white/70 bg-white/45 hover:bg-white/70"}`} aria-pressed={sourceType === option.type}><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#031730] text-white"><Icon name={option.icon} className="h-4 w-4"/></span><strong className="mt-2 block text-xs">{option.type}</strong><span className="mt-1 block text-[10px] leading-4 text-[#667085]">{option.description}</span></button>)}</div></fieldset>
                      <label className="grid gap-1.5 text-xs font-bold text-[#25364A] sm:col-span-2">Source name<input value={sourceName} onChange={(event: ChangeEvent<HTMLInputElement>) => setSourceName(event.target.value)} required placeholder="Name this prototype connection" className="h-11 rounded-xl border border-black/10 bg-white/75 px-3 text-sm font-normal outline-none focus:border-[#4C759D]"/></label>
                      <label className="grid gap-1.5 text-xs font-bold text-[#25364A] sm:col-span-2">Location or endpoint<input value={sourceLocation} onChange={(event: ChangeEvent<HTMLInputElement>) => setSourceLocation(event.target.value)} required placeholder="Paste a SharePoint, OneDrive, website, API, or file location" className="h-11 rounded-xl border border-black/10 bg-white/75 px-3 text-sm font-normal outline-none focus:border-[#4C759D]"/></label>
                      <label className="grid gap-1.5 text-xs font-bold text-[#25364A] sm:col-span-2">Scope or notes <span className="font-normal text-[#667085]">(optional)</span><input value={sourceScope} onChange={(event: ChangeEvent<HTMLInputElement>) => setSourceScope(event.target.value)} placeholder="Describe folders, file types, or content boundaries" className="h-11 rounded-xl border border-black/10 bg-white/75 px-3 text-sm font-normal outline-none focus:border-[#4C759D]"/></label>
                      <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2"><p className="max-w-lg text-[11px] leading-5 text-[#667085]">Hackathon mode records configuration metadata only. It does not claim to upload, index, or authenticate this source unless a server-managed source API is configured.</p><button type="submit" className="rounded-xl bg-[#031730] px-5 py-3 text-xs font-bold text-white">Add configuration</button></div>
                    </form>
                  )}

                  {dataSources.length === 0 ? (
                    <div className="px-5 py-7 sm:px-6"><div className="text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8EDF2] text-[#4C759D]"><Icon name="database" /></div><h3 className="mt-4 font-serif text-xl">Connect your first source</h3><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#667085]">Choose a production-aligned source type. The hackathon dashboard will simulate its configuration without claiming the client has completed ingestion or authentication.</p></div><div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{connectorOptions.map((option) => <button key={option.type} onClick={() => { setSourceType(option.type); setSourceFormOpen(true); }} className="glass-button rounded-xl p-3 text-left transition hover:-translate-y-0.5"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#031730] text-white"><Icon name={option.icon} className="h-4 w-4"/></span><strong className="mt-2 block text-xs">{option.type}</strong><span className="mt-1 block text-[10px] leading-4 text-[#667085]">{option.description}</span></button>)}</div></div>
                  ) : (
                    <div className="divide-y divide-black/10">
                      {dataSources.map((source) => {
                        const connector = connectorFor(source.type);
                        return <article key={source.id} className="px-5 py-5 sm:px-6">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                            <div className="flex min-w-0 flex-1 gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8EDF2] text-[#4C759D]"><Icon name={connector.icon} className="h-5 w-5"/></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-serif text-lg">{source.name}</h3><span className="rounded-full bg-[#F2ECE8] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#8E695B]">{source.type}</span><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${source.status === "Checking" ? "bg-[#CFE4F8] text-[#18324D]" : source.enabled ? "bg-[#E8EDF2] text-[#18324D]" : "bg-[#F1F1F1] text-[#667085]"}`}>{integrationStatus?.sources.apiConfigured ? source.status : source.enabled ? "Prototype configured" : "Paused"}</span></div><p className="mt-1 break-all text-xs text-[#667085]">{source.location}</p>{source.scope && <p className="mt-1 text-xs text-[#667085]">Scope: {source.scope}</p>}<p className="mt-2 text-[10px] text-[#667085]">{source.lastChecked ? `Last reviewed ${formatAdminTime(source.lastChecked)}` : `Added ${formatAdminTime(source.created)}`}</p></div></div>
                            <div className="flex flex-wrap gap-2 lg:justify-end"><button onClick={() => checkDataSource(source.id)} disabled={!source.enabled || source.status === "Checking"} className="glass-button inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-[#4C759D] disabled:cursor-not-allowed disabled:opacity-50"><Icon name="refresh" className="h-3.5 w-3.5"/>{integrationStatus?.sources.apiConfigured ? "Check" : "Review"}</button><button onClick={() => toggleDataSource(source.id)} className="glass-button inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-[#18324D]"><Icon name={source.enabled ? "pause" : "play"} className="h-3.5 w-3.5"/>{source.enabled ? "Pause" : "Enable"}</button><button onClick={() => removeDataSource(source.id)} className="glass-button inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-[#8E695B]"><Icon name="trash" className="h-3.5 w-3.5"/>Remove</button></div>
                          </div>
                        </article>;
                      })}
                    </div>
                  )}
                </section>

                <div className="space-y-6">
                  <section className="glass-panel reveal reveal-delay-1 rounded-[22px] p-6">
                    <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8E695B]">Agent integration</p><h2 className="mt-2 font-serif text-2xl">Copilot Studio</h2></div><span className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${integrationStatus?.agent.configured ? "bg-[#CFE4F8] text-[#031730]" : "bg-[#F2ECE8] text-[#8E695B]"}`}>{integrationStatus?.agent.configured ? "Configured" : "Not configured"}</span></div>
                    <div className="glass-inset mt-5 rounded-2xl p-4"><div className="flex gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#031730] text-[#CFE4F8]"><Icon name="bot" /></div><div><p className="text-sm font-bold">{integrationStatus?.agent.provider || "Microsoft Copilot Studio"}</p><p className="mt-1 text-xs leading-5 text-[#667085]">{integrationStatus?.agent.configured ? `Connected through ${integrationStatus.agent.connectionMethod}. Questions can flow to the configured agent.` : "Add the server-side Direct Line secret in Vercel to connect the agent."}</p></div></div></div>
                  </section>

                  <section className="glass-panel reveal reveal-delay-2 overflow-hidden rounded-[22px]">
                    <div className="flex items-center justify-between border-b border-black/10 px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8E695B]">Live workflow</p><h2 className="mt-1 font-serif text-xl">Routed requests</h2></div><span className="rounded-full bg-[#E8EDF2] px-3 py-1.5 text-xs font-bold text-[#18324D]">{requests.length}</span></div>
                    {requests.length === 0 ? <div className="px-5 py-8 text-center"><p className="text-sm font-bold">No routed requests</p><p className="mt-1 text-xs leading-5 text-[#667085]">Requests appear here only after a user creates one from an unanswered question.</p></div> : <div className="divide-y divide-black/10">{requests.slice(0, 4).map((item) => <div key={item.id} className="px-5 py-4"><p className="text-[10px] font-bold text-[#4C759D]">{item.id}</p><p className="mt-1 text-sm font-bold">{item.question}</p><p className="mt-1 text-xs text-[#667085]">{item.team} · {item.status}</p></div>)}</div>}
                  </section>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function NavButton({ active, icon, label, count, onClick }: { active: boolean; icon: IconName; label: string; count?: number; onClick: () => void }) {
  return <button onClick={onClick} className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${active ? "bg-[#031730] text-white shadow-lg shadow-[#031730]/15" : "text-[#4B5C70] hover:bg-[#F1F1F1] hover:text-[#031730]"}`}><Icon name={icon} className="h-[18px] w-[18px]"/><span className="flex-1">{label}</span>{count !== undefined && <span className={`rounded-full px-2 py-0.5 text-[10px] ${active ? "bg-white/15 text-white" : "bg-[#E8EDF2] text-[#4C759D]"}`}>{count}</span>}</button>;
}

function PageHeader({ eyebrow, title, description, theme, onToggleTheme }: { eyebrow: string; title: string; description: string; theme: Theme; onToggleTheme: () => void }) {
  return <header className="glass-header reveal"><div className="mx-auto flex max-w-[1260px] flex-col justify-between gap-4 px-4 py-6 sm:px-6 md:flex-row md:items-center lg:px-8"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E695B]">{eyebrow}</p><h1 className="mt-1 font-serif text-3xl tracking-tight text-[#031730] sm:text-4xl">{title}</h1><p className="mt-2 text-sm text-[#667085]">{description}</p></div><ThemeToggle theme={theme} onToggle={onToggleTheme}/></div></header>;
}

function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const nextTheme = theme === "light" ? "dark" : "light";
  return <button type="button" onClick={onToggle} className="glass-button inline-flex h-11 items-center gap-2 self-start rounded-xl px-3 text-xs font-bold text-[#18324D] md:self-auto" aria-label={`Switch to ${nextTheme} mode`} title={`Switch to ${nextTheme} mode`}><Icon name={theme === "light" ? "moon" : "sun"} className="h-4 w-4"/><span className="hidden sm:inline">{theme === "light" ? "Dark" : "Light"} mode</span></button>;
}

function formatAdminTime(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

function AdminMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="glass-card reveal rounded-[20px] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#667085]">{label}</p><div className="mt-3 flex items-end justify-between"><p className="font-serif text-4xl">{value}</p><p className="mb-1 text-xs text-[#8E695B]">{detail}</p></div></div>;
}

function RouteResult({ contact, onCreate }: { contact: RoutingContact; onCreate: () => void }) {
  const teamsUrl = teamsChatUrl(contact.teamsUpn);
  return <div className="glass-warm mt-4 overflow-hidden rounded-2xl"><div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"><img src={contact.avatar} alt={`${contact.name} fictional avatar`} width={60} height={60} loading="lazy" className="h-14 w-14 rounded-full border-2 border-white object-cover shadow"/><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8E695B]">Recommended person</p><h3 className="mt-1 font-serif text-lg">{contact.name}</h3><p className="text-xs text-[#667085]">{contact.title} · {contact.department}<br/>{contact.response}</p></div><div className="flex flex-wrap gap-2">{teamsUrl && <a href={teamsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#031730] px-4 py-3 text-xs font-bold text-white"><Icon name="user" className="h-4 w-4"/>Chat in Teams</a>}<button onClick={onCreate} className="glass-button inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold text-[#18324D]"><Icon name="plus" className="h-4 w-4"/>Create request</button></div></div></div>;
}

function ContactCard({ contact }: { contact: RoutingContact }) {
  const teamsUrl = teamsChatUrl(contact.teamsUpn);
  return <article className="glass-card reveal flex items-center gap-4 rounded-[22px] p-5 transition"><img src={contact.avatar} alt={`${contact.name} fictional avatar`} width={76} height={76} loading="lazy" className="h-[72px] w-[72px] shrink-0 rounded-full border-4 border-[#F7F5F3] object-cover"/><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8E695B]">{contact.department}</p><h2 className="mt-1 font-serif text-xl">{contact.name}</h2><p className="mt-1 text-xs leading-5 text-[#667085]">{contact.title} · {contact.location}</p><div className="mt-2 flex flex-wrap gap-1.5">{(contact.expertise || []).map((item) => <span key={item} className="rounded-full bg-[#E8EDF2] px-2.5 py-1 text-[9px] font-bold text-[#4C759D]">{item}</span>)}</div></div>{teamsUrl ? <a href={teamsUrl} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#031730] text-white hover:bg-[#18324D]" aria-label={`Start a Microsoft Teams chat with ${contact.name}`} title="Chat in Microsoft Teams"><Icon name="chevron" className="h-4 w-4"/></a> : <button disabled className="flex h-10 w-10 shrink-0 cursor-not-allowed items-center justify-center rounded-xl bg-[#F1F1F1] text-[#98A2B3]" aria-label={`Microsoft Teams chat is unavailable for ${contact.name}`} title="Teams target unavailable"><Icon name="chevron" className="h-4 w-4"/></button>}</article>;
}
