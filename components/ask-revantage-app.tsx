"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { POLICIES, ROUTING_CONTACTS, type RoutingContact } from "@/data/knowledge";

type View = "ask" | "knowledge" | "routes" | "admin";
type AgentStatus = "ready" | "connected" | "unavailable";
type Source = {
  title: string;
  section: string;
  category: string;
  version: string;
  href: string;
  owner?: string;
  effective?: string;
  description?: string;
  downloadName?: string;
};
type Message = {
  id: string;
  role: "assistant" | "user";
  text: string;
  sourceType?: "policy" | "copilot" | "route";
  source?: Source;
  confidence?: number;
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

type DataSourceType = "SharePoint" | "OneDrive" | "Website" | "API" | "File upload";
type DataSourceStatus = "Ready" | "Checking" | "Paused";
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

type IconName = "spark" | "book" | "route" | "admin" | "send" | "home" | "search" | "external" | "download" | "copy" | "check" | "menu" | "close" | "shield" | "clock" | "chevron" | "user" | "plus" | "database" | "refresh" | "trash" | "pause" | "play";

const iconPaths: Record<IconName, React.ReactNode> = {
  spark: <><path d="M12 2l1.45 4.55L18 8l-4.55 1.45L12 14l-1.45-4.55L6 8l4.55-1.45L12 2Z"/><path d="m19 14 .85 2.15L22 17l-2.15.85L19 20l-.85-2.15L16 17l2.15-.85L19 14Z"/></>,
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
};

const DATA_SOURCE_KEY = "ask-revantage.data-sources.v1";
const sourceTypes: DataSourceType[] = ["SharePoint", "OneDrive", "Website", "API", "File upload"];

function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>;
}

const starterQuestions = [
  { label: "Cab & transport", question: "How do I book a cab for a late shift?" },
  { label: "People & leave", question: "How many annual leave days can I carry forward?" },
  { label: "Expenses", question: "Which travel expenses can I reimburse?" },
];

const categoryAccent: Record<string, string> = {
  "People & Leave": "bg-[#F2ECE8] text-[#8E695B]",
  "Cab & Transport": "bg-[#CFE4F8] text-[#18324D]",
  "Travel & Expenses": "bg-[#E8EDF2] text-[#4C759D]",
  "IT & Security": "bg-[#18324D] text-white",
  "Workplace & Facilities": "bg-[#F1F1F1] text-[#031730]",
};

const viewPaths: Record<View, string> = {
  ask: "/",
  knowledge: "/knowledge",
  routes: "/support",
  admin: "/admin",
};

function newId(prefix: string) {
  return `${prefix}-${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;
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
      text: "Hello, I’m Ask Revantage. Ask me about workplace policies, cab bookings, leave, expenses, IT access, or office services. I’ll show the source or route your question to the right team.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>("ready");
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus | null>(null);
  const [sourceFormOpen, setSourceFormOpen] = useState(false);
  const [sourceName, setSourceName] = useState("");
  const [sourceType, setSourceType] = useState<DataSourceType>("SharePoint");
  const [sourceLocation, setSourceLocation] = useState("");
  const [sourceScope, setSourceScope] = useState("");
  const [documentQuery, setDocumentQuery] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [notice, setNotice] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

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
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filteredDocuments = useMemo(() => {
    const normalized = documentQuery.trim().toLowerCase();
    if (!normalized) return POLICIES;
    return POLICIES.filter((policy) => `${policy.title} ${policy.category} ${policy.description} ${policy.owner}`.toLowerCase().includes(normalized));
  }, [documentQuery]);

  function navigate(next: View) {
    setView(next);
    setMobileOpen(false);
    router.push(viewPaths[next]);
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
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The answer could not be retrieved.");
      setAgentStatus(result.agentStatus || "ready");
      setMessages((current) => [
        ...current,
        {
          id: newId("message"),
          role: "assistant",
          text: result.answer,
          sourceType: result.sourceType,
          source: result.source,
          confidence: result.confidence,
          route: result.route,
          question: text,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: newId("message"),
          role: "assistant",
          text: error instanceof Error ? error.message : "The answer could not be retrieved. Please try again.",
          sourceType: "route",
          route: ROUTING_CONTACTS[0],
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
      team: route.team,
      contact: route.name,
      created: new Date().toISOString(),
      status: "Open",
    };
    const next = [item, ...requests];
    setRequests(next);
    localStorage.setItem("ask-revantage.requests", JSON.stringify(next));
    setNotice(`${item.id} created and routed to ${route.team}.`);
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
      status: "Ready",
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
    setSourceType("SharePoint");
    setSourceFormOpen(false);
    setNotice(`${item.name} added to the configured source workspace.`);
  }

  async function toggleDataSource(id: string) {
    const selected = dataSources.find((source) => source.id === id);
    if (!selected) return;
    const next = dataSources.map((source) => source.id === id ? { ...source, enabled: !source.enabled, status: (!source.enabled ? "Ready" : "Paused") as DataSourceStatus } : source);
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
      const completed = current.map((source) => source.id === id ? { ...source, status: "Ready" as DataSourceStatus, lastChecked: new Date().toISOString() } : source);
      saveDataSources(completed);
      setNotice("Connection check completed for the configured source.");
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

  return (
    <main className="app-shell min-h-screen text-[#031730]">
      {notice && <div role="status" className="glass-dark fixed right-5 top-5 z-[80] max-w-sm rounded-xl px-4 py-3 text-sm text-white">{notice}</div>}

      <header className="glass-nav fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between px-4 lg:hidden">
        <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-[#031730]" aria-label="Open navigation"><Icon name="menu" /></button>
        <Image src="/assets/ask-revantage-logo.jpeg" alt="Ask Revantage" width={180} height={100} className="h-12 w-auto object-contain" priority />
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#031730] text-xs font-bold text-white">SG</div>
      </header>

      <aside className={`glass-sidebar fixed inset-y-0 left-0 z-[60] flex w-[286px] flex-col transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[132px] items-center justify-center border-b border-black/10 px-5">
          <Image src="/assets/ask-revantage-logo.jpeg" alt="Ask Revantage — One Question. One Place. One Answer." width={250} height={140} className="h-[108px] w-[240px] object-contain" priority />
          <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 rounded-lg p-2 text-[#4C759D] lg:hidden" aria-label="Close navigation"><Icon name="close" /></button>
        </div>

        <nav className="flex-1 px-4 py-6" aria-label="Main navigation">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E695B]">Workspace</p>
          <NavButton active={view === "ask"} icon="spark" label="Ask Revantage" onClick={() => navigate("ask")} />
          <NavButton active={view === "knowledge"} icon="book" label="Knowledge library" count={POLICIES.length} onClick={() => navigate("knowledge")} />
          <NavButton active={view === "routes"} icon="route" label="Support routes" count={ROUTING_CONTACTS.length} onClick={() => navigate("routes")} />
          <div className="my-6 border-t border-black/10" />
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E695B]">Manage</p>
          <NavButton active={view === "admin"} icon="admin" label="Admin overview" count={requests.length || undefined} onClick={() => navigate("admin")} />
        </nav>

        <div className="glass-dark m-4 rounded-2xl p-4 text-white">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold"><span className={`h-2 w-2 rounded-full ${agentStatus === "connected" ? "bg-[#CFE4F8]" : agentStatus === "unavailable" ? "bg-[#8E695B]" : "bg-[#4C759D]"}`} />Copilot Studio</div>
            <span className="rounded-full border border-white/20 px-2 py-1 text-[9px] uppercase tracking-wider">{agentStatus}</span>
          </div>
          <p className="text-xs leading-5 text-white/70">Policy answers work now. Add the server-side agent setting in Vercel to activate live AI for unmatched questions.</p>
        </div>

        <div className="flex items-center gap-3 border-t border-black/10 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2ECE8] text-sm font-bold text-[#8E695B]">SG</div>
          <div className="min-w-0"><p className="truncate text-sm font-bold">Shruti Gupta</p><p className="truncate text-xs text-[#667085]">User workspace</p></div>
        </div>
      </aside>

      {mobileOpen && <button className="fixed inset-0 z-[55] bg-[#031730]/50 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" />}

      <section className="min-h-screen pt-16 lg:ml-[286px] lg:pt-0">
        {view === "ask" && (
          <div className="flex min-h-screen flex-col">
            <PageHeader eyebrow="Employee knowledge" title="Ask Revantage" description="Clear answers, visible sources, and a direct path to human support." agentStatus={agentStatus} />
            <div className="mx-auto flex w-full max-w-[1260px] flex-1 flex-col gap-5 px-4 py-5 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_290px] lg:px-8 lg:py-7">
              <section className="glass-panel reveal reveal-delay-1 flex min-h-[680px] flex-col overflow-hidden rounded-[24px]">
                <div className="glass-divider flex items-center justify-between px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#031730] text-[#CFE4F8]"><Icon name="spark" /></div>
                    <div><h2 className="font-serif text-lg">Policy conversation</h2><p className="text-xs text-[#667085]">Grounded in {POLICIES.length} available documents</p></div>
                  </div>
                  <button onClick={() => setMessages([{ id: newId("welcome"), role: "assistant", text: "New conversation started. What would you like to know?" }])} className="rounded-lg border border-black/10 px-3 py-2 text-xs font-bold text-[#4C759D] hover:bg-[#F1F1F1]">New conversation</button>
                </div>

                <div className="chat-scroll flex-1 space-y-6 overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(207,228,248,0.42),transparent_28%)] px-4 py-7 sm:px-8">
                  {messages.map((message) => (
                    <article key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      {message.role === "assistant" && <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#031730] text-[#CFE4F8]"><Icon name="spark" className="h-4 w-4" /></div>}
                      <div className={`max-w-[760px] ${message.role === "user" ? "rounded-2xl rounded-br-sm bg-[#18324D] px-5 py-3.5 text-white" : "min-w-0"}`}>
                        {message.role === "assistant" && <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8E695B]">Ask Revantage</p>}
                        <p className={`text-sm leading-6 ${message.role === "assistant" ? "text-[#25364A]" : "text-white"}`}>{message.text}</p>

                        {message.role === "assistant" && message.source && (
                          <div className="glass-inset mt-4 overflow-hidden rounded-2xl">
                            <div className="border-b border-white/70 bg-white/30 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#4C759D]"><Icon name="book" className="h-4 w-4" />{message.sourceType === "copilot" ? "Connected AI response" : "Supporting source document"}</p>
                                {message.confidence ? <span className="rounded-full bg-[#E8EDF2] px-3 py-1 text-[10px] font-bold text-[#18324D]">{message.confidence}% match</span> : null}
                              </div>
                            </div>
                            <div className="p-4">
                              <h3 className="font-serif text-lg text-[#031730]">{message.source.title}</h3>
                              <p className="mt-1 text-xs font-bold text-[#4C759D]">{message.source.section}</p>
                              {message.source.description && <p className="mt-2 text-xs leading-5 text-[#667085]">{message.source.description}</p>}
                              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] sm:grid-cols-4">
                                <div><dt className="text-[#667085]">Category</dt><dd className="mt-0.5 font-bold text-[#25364A]">{message.source.category}</dd></div>
                                <div><dt className="text-[#667085]">Version</dt><dd className="mt-0.5 font-bold text-[#25364A]">{message.source.version}</dd></div>
                                {message.source.owner && <div><dt className="text-[#667085]">Owner</dt><dd className="mt-0.5 font-bold text-[#25364A]">{message.source.owner}</dd></div>}
                                {message.source.effective && <div><dt className="text-[#667085]">Effective</dt><dd className="mt-0.5 font-bold text-[#25364A]">{message.source.effective}</dd></div>}
                              </dl>
                              <div className="mt-4 flex flex-wrap gap-2">
                                {message.source.href && <a href={message.source.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-[#031730] px-3 py-2 text-xs font-bold text-white"><Icon name="external" className="h-3.5 w-3.5" />Open in new tab</a>}
                                {message.source.href && <a href={message.source.href} download={message.source.downloadName || true} className="glass-button inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-[#18324D]"><Icon name="download" className="h-3.5 w-3.5" />Download document</a>}
                                <button onClick={() => copyAnswer(message)} className="glass-button inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-[#4C759D]"><Icon name={copiedId === message.id ? "check" : "copy"} className="h-3.5 w-3.5" />{copiedId === message.id ? "Copied" : "Copy answer"}</button>
                              </div>
                            </div>
                          </div>
                        )}

                        {message.role === "assistant" && message.route && (
                          <RouteResult contact={message.route} onCreate={() => createRequest(message.route!, message.question || "Support requested")} />
                        )}
                      </div>
                    </article>
                  ))}
                  {loading && <div className="flex gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#031730] text-[#CFE4F8]"><Icon name="spark" className="h-4 w-4" /></div><div className="flex items-center gap-1.5 rounded-2xl bg-[#F1F1F1] px-4 py-3"><span className="thinking-dot"/><span className="thinking-dot"/><span className="thinking-dot"/></div></div>}
                  <div ref={endRef} />
                </div>

                <div className="glass-composer p-4 sm:p-5">
                  <form onSubmit={submit} className="glass-input mx-auto flex max-w-4xl items-end gap-2 rounded-2xl p-2 focus-within:ring-4 focus-within:ring-[#CFE4F8]/60">
                    <textarea value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); ask(); } }} rows={1} placeholder="Ask about leave, cabs, expenses, access, or office services…" className="min-h-12 flex-1 resize-none bg-transparent px-3 py-3 text-sm leading-6 outline-none placeholder:text-[#98A2B3]" aria-label="Ask a workplace question" />
                    <button type="submit" disabled={!question.trim() || loading} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#031730] text-white transition hover:bg-[#18324D] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send question"><Icon name="send" /></button>
                  </form>
                  <div className="mx-auto mt-2 flex max-w-4xl items-center justify-between gap-4 text-[10px] text-[#667085]"><span className="flex items-center gap-1.5"><Icon name="shield" className="h-3.5 w-3.5" />Answers show the source when available</span><span className="hidden sm:inline">Enter to send · Shift + Enter for a new line</span></div>
                </div>
              </section>

              <aside className="space-y-5">
                <div className="glass-dark reveal reveal-delay-2 rounded-[22px] p-5 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#CFE4F8]">Suggested prompts</p>
                  <h2 className="mt-2 font-serif text-xl">A faster way to begin</h2>
                  <div className="mt-4 flex flex-col gap-2" aria-label="Three suggested prompts">
                    {starterQuestions.map((starter) => <button key={starter.question} onClick={() => ask(starter.question)} className="group inline-flex w-full items-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-4 py-2.5 text-left transition hover:border-white/35 hover:bg-white/[0.14]"><span className="h-2 w-2 shrink-0 rounded-full bg-[#CFE4F8]"/><span className="min-w-0 flex-1 text-xs leading-5 text-white/90">{starter.question}</span><Icon name="chevron" className="h-3.5 w-3.5 shrink-0 transition group-hover:translate-x-0.5" /><span className="sr-only">{starter.label}</span></button>)}
                  </div>
                </div>

                <div className="glass-panel reveal reveal-delay-3 rounded-[22px] p-5">
                  <div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8E695B]">Knowledge pulse</p><span className="h-2 w-2 rounded-full bg-[#4C759D]" /></div>
                  <div className="mt-4 grid grid-cols-2 gap-3"><Metric value={POLICIES.length.toString()} label="Documents"/><Metric value={POLICIES.reduce((sum, policy) => sum + policy.sections.length, 0).toString()} label="Answer sections"/></div>
                  <button onClick={() => navigate("knowledge")} className="mt-4 flex w-full items-center justify-between rounded-xl bg-[#F2ECE8] px-4 py-3 text-xs font-bold text-[#8E695B]">Browse the library<Icon name="chevron" className="h-4 w-4" /></button>
                </div>
              </aside>
            </div>
          </div>
        )}

        {view === "knowledge" && (
          <>
            <PageHeader eyebrow="Approved knowledge" title="Knowledge library" description="Explore the documents that power policy answers." agentStatus={agentStatus} />
            <div className="mx-auto max-w-[1260px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              <div className="glass-panel reveal mb-6 flex flex-col justify-between gap-4 rounded-[22px] p-5 sm:flex-row sm:items-center">
                <div><p className="font-serif text-xl">{filteredDocuments.length} available documents</p><p className="mt-1 text-sm text-[#667085]">Each answer links back to the matching document section.</p></div>
                <label className="flex h-11 min-w-0 items-center gap-2 rounded-xl border border-black/10 bg-[#F7F5F3] px-3 sm:w-80"><Icon name="search" className="h-4 w-4 text-[#4C759D]"/><input value={documentQuery} onChange={(event) => setDocumentQuery(event.target.value)} placeholder="Search documents" className="w-full bg-transparent text-sm outline-none"/></label>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredDocuments.map((policy, index) => (
                  <article key={policy.id} className="glass-card reveal group flex min-h-[285px] flex-col rounded-[22px] p-5 transition hover:-translate-y-1">
                    <div className="flex items-start justify-between gap-3"><span className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold ${categoryAccent[policy.category] || "bg-[#F1F1F1] text-[#031730]"}`}>{policy.category}</span><span className="font-serif text-3xl text-[#8E695B]/35">0{index + 1}</span></div>
                    <h2 className="mt-5 font-serif text-2xl leading-tight">{policy.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-[#667085]">{policy.description}</p>
                    <div className="mt-auto pt-6"><div className="flex items-center justify-between border-t border-black/10 pt-4 text-[11px] text-[#667085]"><span>Version {policy.version}</span><span>{policy.effective}</span></div><a href={policy.href} target="_blank" rel="noreferrer" className="mt-3 flex items-center justify-between rounded-xl bg-[#031730] px-4 py-3 text-xs font-bold text-white">Open source document<Icon name="external" className="h-4 w-4" /></a></div>
                  </article>
                ))}
              </div>
            </div>
          </>
        )}

        {view === "routes" && (
          <>
            <PageHeader eyebrow="Human support" title="Support routes" description="When AI cannot answer confidently, the question moves to a visible team route." agentStatus={agentStatus} />
            <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              <div className="glass-dark reveal mb-7 rounded-[24px] p-6 text-white sm:p-8"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#CFE4F8]">Designed for continuity</p><h2 className="mt-2 max-w-2xl font-serif text-3xl">No dead ends. Every question has a next step.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">Ask Revantage classifies the topic, recommends the relevant team, and creates a trackable request using the user’s original question.</p></div>
              <div className="grid gap-4 md:grid-cols-2">
                {ROUTING_CONTACTS.map((contact) => <ContactCard key={contact.id} contact={contact} onAsk={() => ask(`I need help from ${contact.team} with a question that is not covered in the policy library.`)} />)}
              </div>
            </div>
          </>
        )}

        {view === "admin" && (
          <>
            <PageHeader eyebrow="Administration" title="Sources & agent connections" description="Configure where Ask Revantage gets its knowledge and manage each connection from one workspace." agentStatus={agentStatus} />
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
                      <label className="grid gap-1.5 text-xs font-bold text-[#25364A]">Source name<input value={sourceName} onChange={(event) => setSourceName(event.target.value)} required placeholder="Name this connection" className="h-11 rounded-xl border border-black/10 bg-white/75 px-3 text-sm font-normal outline-none focus:border-[#4C759D]"/></label>
                      <label className="grid gap-1.5 text-xs font-bold text-[#25364A]">Source type<select value={sourceType} onChange={(event) => setSourceType(event.target.value as DataSourceType)} className="h-11 rounded-xl border border-black/10 bg-white/75 px-3 text-sm font-normal outline-none focus:border-[#4C759D]">{sourceTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
                      <label className="grid gap-1.5 text-xs font-bold text-[#25364A] sm:col-span-2">Location or endpoint<input value={sourceLocation} onChange={(event) => setSourceLocation(event.target.value)} required placeholder="Paste a SharePoint, OneDrive, website, API, or file location" className="h-11 rounded-xl border border-black/10 bg-white/75 px-3 text-sm font-normal outline-none focus:border-[#4C759D]"/></label>
                      <label className="grid gap-1.5 text-xs font-bold text-[#25364A] sm:col-span-2">Scope or notes <span className="font-normal text-[#667085]">(optional)</span><input value={sourceScope} onChange={(event) => setSourceScope(event.target.value)} placeholder="Describe folders, file types, or content boundaries" className="h-11 rounded-xl border border-black/10 bg-white/75 px-3 text-sm font-normal outline-none focus:border-[#4C759D]"/></label>
                      <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2"><p className="max-w-md text-[11px] leading-5 text-[#667085]">Credentials stay server-side. This workspace stores connection metadata only and is ready to hand off to a configured source-management API.</p><button type="submit" className="rounded-xl bg-[#031730] px-5 py-3 text-xs font-bold text-white">Save source</button></div>
                    </form>
                  )}

                  {dataSources.length === 0 ? (
                    <div className="flex min-h-[330px] flex-col items-center justify-center px-6 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8EDF2] text-[#4C759D]"><Icon name="database" /></div>
                      <h3 className="mt-4 font-serif text-xl">No data sources configured</h3>
                      <p className="mt-2 max-w-md text-sm leading-6 text-[#667085]">Add a source to demonstrate how administrators connect and manage SharePoint, OneDrive, websites, APIs, or uploaded files.</p>
                      <button onClick={() => setSourceFormOpen(true)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#031730] px-4 py-2.5 text-xs font-bold text-white"><Icon name="plus" className="h-4 w-4"/>Add the first source</button>
                    </div>
                  ) : (
                    <div className="divide-y divide-black/10">
                      {dataSources.map((source) => (
                        <article key={source.id} className="px-5 py-5 sm:px-6">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                            <div className="flex min-w-0 flex-1 gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8EDF2] text-[#4C759D]"><Icon name="database" className="h-5 w-5"/></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-serif text-lg">{source.name}</h3><span className="rounded-full bg-[#F2ECE8] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#8E695B]">{source.type}</span><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${source.status === "Checking" ? "bg-[#CFE4F8] text-[#18324D]" : source.enabled ? "bg-[#E8EDF2] text-[#18324D]" : "bg-[#F1F1F1] text-[#667085]"}`}>{source.status}</span></div><p className="mt-1 break-all text-xs text-[#667085]">{source.location}</p>{source.scope && <p className="mt-1 text-xs text-[#667085]">Scope: {source.scope}</p>}<p className="mt-2 text-[10px] text-[#667085]">{source.lastChecked ? `Last checked ${formatAdminTime(source.lastChecked)}` : `Added ${formatAdminTime(source.created)}`}</p></div></div>
                            <div className="flex flex-wrap gap-2 lg:justify-end"><button onClick={() => checkDataSource(source.id)} disabled={!source.enabled || source.status === "Checking"} className="glass-button inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-[#4C759D] disabled:cursor-not-allowed disabled:opacity-50"><Icon name="refresh" className="h-3.5 w-3.5"/>Check</button><button onClick={() => toggleDataSource(source.id)} className="glass-button inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-[#18324D]"><Icon name={source.enabled ? "pause" : "play"} className="h-3.5 w-3.5"/>{source.enabled ? "Pause" : "Enable"}</button><button onClick={() => removeDataSource(source.id)} className="glass-button inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-[#8E695B]"><Icon name="trash" className="h-3.5 w-3.5"/>Remove</button></div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <div className="space-y-6">
                  <section className="glass-panel reveal reveal-delay-1 rounded-[22px] p-6">
                    <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8E695B]">Agent integration</p><h2 className="mt-2 font-serif text-2xl">Copilot Studio</h2></div><span className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${integrationStatus?.agent.configured ? "bg-[#CFE4F8] text-[#031730]" : "bg-[#F2ECE8] text-[#8E695B]"}`}>{integrationStatus?.agent.configured ? "Configured" : "Not configured"}</span></div>
                    <div className="glass-inset mt-5 rounded-2xl p-4"><div className="flex gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#031730] text-[#CFE4F8]"><Icon name="spark" /></div><div><p className="text-sm font-bold">{integrationStatus?.agent.provider || "Microsoft Copilot Studio"}</p><p className="mt-1 text-xs leading-5 text-[#667085]">{integrationStatus?.agent.configured ? `Connected through ${integrationStatus.agent.connectionMethod}. Questions can flow to the configured agent.` : "Add the server-side token endpoint or Direct Line secret in Vercel to connect the agent."}</p></div></div></div>
                    <p className="mt-4 rounded-xl border border-[#8E695B]/20 bg-[#F2ECE8]/60 p-3 text-xs leading-5 text-[#6D4E43]">Connection status comes from server configuration. Secrets are never exposed in this admin view.</p>
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

function PageHeader({ eyebrow, title, description, agentStatus }: { eyebrow: string; title: string; description: string; agentStatus: AgentStatus }) {
  return <header className="glass-header reveal"><div className="mx-auto flex max-w-[1260px] flex-col justify-between gap-4 px-4 py-6 sm:px-6 md:flex-row md:items-center lg:px-8"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E695B]">{eyebrow}</p><h1 className="mt-1 font-serif text-3xl tracking-tight text-[#031730] sm:text-4xl">{title}</h1><p className="mt-2 text-sm text-[#667085]">{description}</p></div><div className="glass-inset flex items-center gap-3 self-start rounded-xl px-3 py-2.5 md:self-auto"><span className={`h-2.5 w-2.5 rounded-full ${agentStatus === "connected" ? "bg-[#4C759D]" : agentStatus === "unavailable" ? "bg-[#8E695B]" : "bg-[#18324D]"}`}/><div><p className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">AI layer</p><p className="text-xs font-bold">{agentStatus === "connected" ? "Copilot Studio connected" : agentStatus === "unavailable" ? "Policy fallback active" : "Ready for Copilot Studio"}</p></div></div></div></header>;
}

function Metric({ value, label }: { value: string; label: string }) {
  return <div className="glass-inset rounded-xl p-3"><p className="font-serif text-2xl">{value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#667085]">{label}</p></div>;
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
  return <div className="glass-warm mt-4 overflow-hidden rounded-2xl"><div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"><Image src={contact.avatar} alt={`${contact.name} illustrated avatar`} width={60} height={60} className="h-14 w-14 rounded-full border-2 border-white object-cover shadow"/><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8E695B]">Recommended support route</p><h3 className="mt-1 font-serif text-lg">{contact.name}</h3><p className="text-xs text-[#667085]">{contact.routeLabel} · {contact.response}</p></div><button onClick={onCreate} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#031730] px-4 py-3 text-xs font-bold text-white"><Icon name="plus" className="h-4 w-4"/>Create request</button></div></div>;
}

function ContactCard({ contact, onAsk }: { contact: RoutingContact; onAsk: () => void }) {
  return <article className="glass-card reveal flex items-center gap-4 rounded-[22px] p-5 transition"><Image src={contact.avatar} alt={`${contact.name} illustrated avatar`} width={76} height={76} className="h-[72px] w-[72px] shrink-0 rounded-full border-4 border-[#F7F5F3] object-cover"/><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8E695B]">{contact.team}</p><h2 className="mt-1 font-serif text-xl">{contact.name}</h2><p className="mt-1 text-xs leading-5 text-[#667085]">{contact.routeLabel}<br/>{contact.response}</p></div><button onClick={onAsk} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F1F1] text-[#4C759D] hover:bg-[#031730] hover:text-white" aria-label={`Ask ${contact.team}`}><Icon name="chevron" className="h-4 w-4"/></button></article>;
}
