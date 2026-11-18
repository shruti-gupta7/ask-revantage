"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { KnowledgeSource, SourceType, SupportRequest } from "@/lib/types";

type Role = "employee" | "admin";
type EmployeeView = "home" | "ask" | "knowledge" | "requests";
type AdminView = "dashboard" | "sources" | "routing" | "analytics";
type View = EmployeeView | AdminView;
type AskResult = { answer: string; confidence: string; team: string; sources: Pick<KnowledgeSource, "id" | "name" | "category" | "updated">[] };

type IconName = "spark" | "home" | "chat" | "book" | "ticket" | "grid" | "database" | "route" | "chart" | "search" | "arrow" | "plus" | "shield" | "travel" | "people" | "finance" | "tech" | "building" | "check" | "external" | "menu" | "close" | "upload";
const paths: Record<IconName, React.ReactNode> = {
  spark: <><path d="m12 2 1.7 5.2L19 9l-5.3 1.8L12 16l-1.7-5.2L5 9l5.3-1.8L12 2Z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/></>,
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>,
  chat: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/><path d="M8 9h8M8 13h5"/></>,
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5Z"/><path d="M4 6.5v13M8 7h8M8 11h6"/></>,
  ticket: <><path d="M4 5h16v5a2 2 0 0 0 0 4v5H4v-5a2 2 0 0 0 0-4Z"/><path d="M9 8v8"/></>,
  grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
  database: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></>,
  route: <><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M9 6h3a4 4 0 0 1 4 4v1M15 14l3-3 3 3"/></>,
  chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  arrow: <><path d="M5 12h14M14 7l5 5-5 5"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  shield: <><path d="M12 3 4 6v5c0 5 3.4 8.8 8 10 4.6-1.2 8-5 8-10V6Z"/><path d="m9 12 2 2 4-4"/></>,
  travel: <><path d="M22 2 9 15M22 2l-7 20-4-9-9-4Z"/></>,
  people: <><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 9M17 15a6 6 0 0 1 5 6"/></>,
  finance: <><path d="M4 7h16M6 11h12M8 15h8M10 19h4M12 3v18"/></>,
  tech: <><rect x="4" y="3" width="16" height="13" rx="2"/><path d="M8 21h8M12 16v5"/></>,
  building: <><path d="M4 21V3h12v18M16 9h4v12M8 7h4M8 11h4M8 15h4M9 21v-3h2v3"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  external: <><path d="M15 3h6v6M10 14 21 3"/><path d="M18 13v7H4V6h7"/></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  upload: <><path d="M12 16V3M7 8l5-5 5 5"/><path d="M4 15v5h16v-5"/></>,
};
function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const employeeNav: { id: EmployeeView; label: string; icon: IconName }[] = [
  { id: "home", label: "Home", icon: "home" }, { id: "ask", label: "Ask Revantage", icon: "chat" },
  { id: "knowledge", label: "Knowledge hub", icon: "book" }, { id: "requests", label: "My requests", icon: "ticket" },
];
const adminNav: { id: AdminView; label: string; icon: IconName }[] = [
  { id: "dashboard", label: "Overview", icon: "grid" }, { id: "sources", label: "Data sources", icon: "database" },
  { id: "routing", label: "Routing queue", icon: "route" }, { id: "analytics", label: "Insights", icon: "chart" },
];
const categories: { title: string; copy: string; icon: IconName; query: string }[] = [
  { title: "People & HR", copy: "Leave, benefits and workplace support", icon: "people", query: "What is the leave policy?" },
  { title: "Travel & Cab", copy: "Bookings, safe travel and expenses", icon: "travel", query: "How does the sample office cab facility work?" },
  { title: "Technology", copy: "Access, devices and security", icon: "tech", query: "How do I request technology access?" },
  { title: "Finance", copy: "Expenses, payroll and reimbursements", icon: "finance", query: "What do I need for an expense claim?" },
  { title: "Facilities", copy: "Office, visitors and workplace services", icon: "building", query: "How do I contact workplace services?" },
];

export default function AskRevantage() {
  const [role, setRole] = useState<Role>("employee");
  const [view, setView] = useState<View>("home");
  const [mobileNav, setMobileNav] = useState(false);
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [question, setQuestion] = useState("");
  const [lastQuestion, setLastQuestion] = useState("");
  const [answer, setAnswer] = useState<AskResult | null>(null);
  const [asking, setAsking] = useState(false);
  const [sourceModal, setSourceModal] = useState(false);
  const [sourceQuery, setSourceQuery] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    Promise.all([fetch("/api/sources").then((r) => r.json()), fetch("/api/requests").then((r) => r.json())])
      .then(([s, r]) => { setSources(s.sources || []); setRequests(r.requests || []); })
      .catch(() => showToast("Demo data could not be loaded."));
  }, []);
  function showToast(message: string) { setToast(message); window.setTimeout(() => setToast(""), 2800); }
  function changeRole(next: Role) { setRole(next); setView(next === "employee" ? "home" : "dashboard"); setMobileNav(false); }
  function go(next: View) { setView(next); setMobileNav(false); }
  async function ask(value?: string) {
    const query = (value ?? question).trim(); if (!query) return;
    setQuestion(""); setLastQuestion(query); setAnswer(null); setAsking(true); setRole("employee"); setView("ask");
    try {
      const response = await fetch("/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: query }) });
      const data = await response.json();
      if (!response.ok) { showToast(data.error || "The question could not be processed."); setLastQuestion(""); }
      else setAnswer(data);
    } catch { showToast("The demo answer service is not available."); }
    finally { setAsking(false); }
  }
  async function createRequest() {
    if (!lastQuestion || !answer) return;
    const response = await fetch("/api/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: lastQuestion, description: lastQuestion, team: answer.team }) });
    const data = await response.json(); if (data.request) { setRequests((items) => [data.request, ...items]); showToast(`${data.request.id} was routed to ${data.request.team}.`); go("requests"); }
  }
  async function addSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const response = await fetch("/api/sources", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (data.source) { setSources((items) => [data.source, ...items]); setSourceModal(false); showToast("Source added to the indexing queue."); }
    else showToast(data.error || "Source could not be added.");
  }
  const filteredSources = useMemo(() => sources.filter((s) => `${s.name} ${s.category} ${s.owner}`.toLowerCase().includes(sourceQuery.toLowerCase())), [sources, sourceQuery]);
  const title = role === "employee" ? employeeNav.find((x) => x.id === view)?.label || "Ask Revantage" : adminNav.find((x) => x.id === view)?.label || "Admin";
  const readyCount = sources.filter((s) => s.status === "Ready").length;

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
      <button className="brand" onClick={() => changeRole("employee")} aria-label="Ask Revantage home">
        <span className="brand-mark"><Image src="/revantage-mark.png" width={26} height={52} alt="Revantage" priority /></span>
        <span><strong>Ask Revantage</strong><small>In Pursuit of Better</small></span>
      </button>
      <div className="workspace-switch" role="group" aria-label="Workspace">
        <button className={role === "employee" ? "active" : ""} onClick={() => changeRole("employee")}>User</button>
        <button className={role === "admin" ? "active" : ""} onClick={() => changeRole("admin")}>Admin</button>
      </div>
      <nav className="nav-list" aria-label={`${role} navigation`}>
        <span className="nav-label">{role === "employee" ? "Your workspace" : "Administration"}</span>
        {(role === "employee" ? employeeNav : adminNav).map((item) => <button key={item.id} onClick={() => go(item.id)} className={view === item.id ? "active" : ""}><Icon name={item.icon}/><span>{item.label}</span>{view === item.id && <i/>}</button>)}
      </nav>
      <div className="sidebar-note"><span className="note-icon"><Icon name="shield" size={18}/></span><div><strong>Approved knowledge</strong><small>Answers stay grounded in trusted sources.</small></div></div>
      <div className="profile"><span className="avatar">DU</span><div><strong>Demo User</strong><small>{role === "employee" ? "Synthetic employee profile" : "Demo administrator"}</small></div><button aria-label="Account options">•••</button></div>
    </aside>
    {mobileNav && <button className="scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation"/>}

    <main className="main">
      <header className="topbar">
        <button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Icon name="menu"/></button>
        <div><span className="top-kicker">{role === "employee" ? "EMPLOYEE EXPERIENCE" : "KNOWLEDGE OPERATIONS"}</span><h1>{title}</h1></div>
        <div className="top-actions"><span className="environment"><i/> Synthetic demo · no production data</span><button className="icon-button" aria-label="Search"><Icon name="search"/></button><span className="top-avatar">DU</span></div>
      </header>

      <div className="page">
        {role === "employee" && view === "home" && <EmployeeHome question={question} setQuestion={setQuestion} ask={ask} go={go} readyCount={readyCount}/>}
        {role === "employee" && view === "ask" && <AskPanel question={question} setQuestion={setQuestion} ask={ask} asking={asking} answer={answer} lastQuestion={lastQuestion} createRequest={createRequest}/>}
        {role === "employee" && view === "knowledge" && <KnowledgeHub sources={filteredSources} query={sourceQuery} setQuery={setSourceQuery} ask={ask}/>}
        {role === "employee" && view === "requests" && <Requests items={requests} ask={() => go("ask")}/>}
        {role === "admin" && view === "dashboard" && <AdminDashboard sources={sources} requests={requests} add={() => setSourceModal(true)} go={go}/>}
        {role === "admin" && view === "sources" && <SourcesPanel sources={filteredSources} query={sourceQuery} setQuery={setSourceQuery} add={() => setSourceModal(true)}/>}
        {role === "admin" && view === "routing" && <Routing items={requests}/>}
        {role === "admin" && view === "analytics" && <Analytics sources={sources} requests={requests}/>}
      </div>
    </main>

    {sourceModal && <div className="modal-layer" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setSourceModal(false); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="source-modal-title">
        <div className="modal-head"><div><span className="eyebrow">NEW CONNECTION</span><h2 id="source-modal-title">Add a data source</h2><p>Connect approved knowledge now. Production connectors can replace the demo adapter later.</p></div><button className="icon-button" onClick={() => setSourceModal(false)} aria-label="Close"><Icon name="close"/></button></div>
        <form onSubmit={addSource} className="source-form">
          <label><span>Source name</span><input required name="name" placeholder="e.g. India People Policy Library"/></label>
          <div className="field-row"><label><span>Type</span><select name="type" defaultValue="SharePoint">{(["SharePoint","OneDrive","Excel","PDF","Website","Manual"] as SourceType[]).map((x) => <option key={x}>{x}</option>)}</select></label><label><span>Category</span><select name="category" defaultValue="People & HR"><option>People & HR</option><option>Travel & Facilities</option><option>Technology</option><option>Finance</option><option>General</option></select></label></div>
          <label><span>Sample location label</span><input name="location" placeholder="Synthetic path or non-production reference only"/></label>
          <label><span>Source owner</span><input name="owner" placeholder="Team accountable for this content"/></label>
          <label><span>Demo content <em>Optional</em></span><textarea name="content" rows={4} placeholder="Use synthetic, anonymized or scrubbed sample text only. Never paste real company data."/></label>
          <label className="confirm-check"><input required type="checkbox" name="isSynthetic"/><span>I confirm this is synthetic, anonymized, scrubbed or non-production data.</span></label>
          <div className="security-callout"><Icon name="shield"/><span><strong>Hackathon data guardrail.</strong> Do not enter real or confidential business data. Production connectors must enforce permissions, review status, retention and privacy requirements.</span></div>
          <div className="modal-actions"><button type="button" className="button secondary" onClick={() => setSourceModal(false)}>Cancel</button><button type="submit" className="button primary"><Icon name="plus" size={17}/>Add source</button></div>
        </form>
      </div>
    </div>}
    <div className={`toast ${toast ? "show" : ""}`}>{toast}</div>
  </div>;
}

function EmployeeHome({ question, setQuestion, ask, go, readyCount }: { question: string; setQuestion: (v: string) => void; ask: (v?: string) => void; go: (v: View) => void; readyCount: number }) {
  return <div className="home-page">
    <section className="hero-panel">
      <div className="hero-pattern"/><div className="hero-content"><span className="hero-eyebrow"><i/> ASK REVANTAGE</span><h2>One place for the answers<br/>that move work forward.</h2><p>Find clear guidance from approved company knowledge — or connect with the right team when you need more help.</p>
      <form className="hero-search" onSubmit={(e) => { e.preventDefault(); ask(); }}><Icon name="spark"/><input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask about leave, cab facilities, expenses, access…" aria-label="Ask Revantage"/><button type="submit"><span>Ask</span><Icon name="arrow"/></button></form>
      <div className="trust-row"><span><Icon name="shield" size={15}/> Synthetic demo data only</span><span><Icon name="check" size={15}/> Source-linked answers</span><span><i className="live-dot"/> {readyCount} sources ready</span></div></div>
    </section>
    <section className="section-block"><div className="section-heading"><div><span className="eyebrow">EXPLORE</span><h2>Start with what you need</h2></div><button className="text-button" onClick={() => go("knowledge")}>Browse all knowledge <Icon name="arrow" size={16}/></button></div>
      <div className="category-grid">{categories.map((c) => <button className="category-card" key={c.title} onClick={() => ask(c.query)}><span className="category-icon"><Icon name={c.icon}/></span><strong>{c.title}</strong><p>{c.copy}</p><span className="round-arrow"><Icon name="arrow" size={16}/></span></button>)}</div>
    </section>
    <section className="split-section"><div className="popular-card"><div className="section-heading compact"><div><span className="eyebrow">POPULAR NOW</span><h2>Questions people ask</h2></div></div>{["How does the sample office cab facility work?","What is the sample leave process?","How do I report a security concern?"].map((q, i) => <button key={q} onClick={() => ask(q)}><span>0{i + 1}</span><strong>{q}</strong><Icon name="arrow" size={17}/></button>)}</div>
      <div className="support-card"><span className="support-icon"><Icon name="people"/></span><span className="eyebrow">HUMAN SUPPORT</span><h2>Still need a person?</h2><p>Ask Revantage classifies unresolved questions and routes a request to the team best placed to help.</p><button className="button light" onClick={() => go("ask")}>Start a conversation <Icon name="arrow" size={17}/></button></div>
    </section>
  </div>;
}

function AskPanel({ question, setQuestion, ask, asking, answer, lastQuestion, createRequest }: { question: string; setQuestion: (v: string) => void; ask: (v?: string) => void; asking: boolean; answer: AskResult | null; lastQuestion: string; createRequest: () => void }) {
  return <div className="ask-layout"><section className="conversation">
    <div className="conversation-head"><div className="assistant-logo"><Image src="/revantage-mark.png" width={20} height={40} alt=""/></div><div><strong>Ask Revantage</strong><small><i/> Demo retrieval · Copilot Studio-ready</small></div><span className="grounded"><Icon name="shield" size={15}/> Grounded answers</span></div>
    <div className="messages">
      {!lastQuestion && <div className="empty-conversation"><span className="large-spark"><Icon name="spark" size={30}/></span><span className="eyebrow">CLEAR. TRUSTED. HUMAN.</span><h2>What can we help you find?</h2><p>Ask in everyday language. We’ll find the best approved source and show you where the answer came from.</p><div className="suggestions">{categories.slice(0,4).map((c) => <button key={c.title} onClick={() => ask(c.query)}><Icon name={c.icon}/><span><strong>{c.title}</strong><small>{c.query}</small></span><Icon name="arrow" size={16}/></button>)}</div></div>}
      {lastQuestion && <><div className="user-message"><span className="avatar small">DU</span><div><small>You</small><p>{lastQuestion}</p></div></div>
        {asking && <div className="assistant-message"><div className="assistant-logo small-logo"><Image src="/revantage-mark.png" width={16} height={32} alt=""/></div><div className="thinking"><span/><span/><span/> Searching approved knowledge</div></div>}
        {answer && <div className="assistant-message"><div className="assistant-logo small-logo"><Image src="/revantage-mark.png" width={16} height={32} alt=""/></div><div className="answer-card"><div className="answer-meta"><span className={`confidence ${answer.confidence === "High" ? "high" : "review"}`}><i/>{answer.confidence} confidence</span><span>Matched to {answer.team}</span></div><p>{answer.answer}</p>
          {answer.sources.length > 0 ? <div className="answer-sources"><span className="eyebrow">SOURCES</span>{answer.sources.map((s) => <button key={s.id}><Icon name="book"/><span><strong>{s.name}</strong><small>{s.category} · Updated {s.updated}</small></span><Icon name="external" size={15}/></button>)}</div> : <div className="route-callout"><span><Icon name="route"/></span><div><strong>Route this question to {answer.team}</strong><small>Create a trackable request instead of relying on an uncertain answer.</small></div><button onClick={createRequest}>Create request</button></div>}
          <div className="answer-footer"><span>Was this useful?</span><button aria-label="Helpful">Yes</button><button aria-label="Not helpful">Not quite</button>{answer.sources.length > 0 && <button className="escalate" onClick={createRequest}>Ask a person</button>}</div>
        </div></div>}
      </>}
    </div>
    <form className="composer" onSubmit={(e) => { e.preventDefault(); ask(); }}><div><Icon name="spark"/><textarea rows={1} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask a follow-up question…" aria-label="Question" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); } }}/><button type="submit" aria-label="Send"><Icon name="arrow"/></button></div><small>AI-assisted demo using synthetic data. Verify important decisions against an authoritative production source.</small></form>
  </section><aside className="conversation-aside"><span className="eyebrow">TRY ASKING</span><h3>Useful starters</h3>{categories.slice(0,4).map((c) => <button key={c.title} onClick={() => ask(c.query)}><span className="mini-icon"><Icon name={c.icon} size={17}/></span><span>{c.query}</span></button>)}<div className="aside-tip"><Icon name="shield"/><strong>Built for trust</strong><p>Every answer shows its source and confidence level. If we do not know, we say so.</p></div></aside></div>;
}

function KnowledgeHub({ sources, query, setQuery, ask }: { sources: KnowledgeSource[]; query: string; setQuery: (v: string) => void; ask: (v: string) => void }) {
  return <div className="content-page"><PageIntro eyebrow="KNOWLEDGE HUB" title="Approved answers, ready when you are." copy="Browse the information Ask Revantage can use. Only reviewed sources are included in answers."/>
    <div className="toolbar-card"><label className="search-box"><Icon name="search"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search policies, guides, and services"/></label><span>{sources.length} sources</span></div>
    <div className="knowledge-grid">{sources.map((s) => <article className="knowledge-card" key={s.id}><div className="source-top"><span className="source-type"><Icon name={s.type === "SharePoint" || s.type === "OneDrive" || s.type === "Excel" ? "grid" : s.type === "Website" ? "external" : "book"}/></span><Status status={s.status}/></div><span className="eyebrow">{s.category.toUpperCase()}</span><h3>{s.name}</h3><p>{s.location} · {s.dataClass}</p><div className="source-details"><span>Owner <strong>{s.owner}</strong></span><span>Updated <strong>{s.updated}</strong></span></div>{s.href ? <a className="source-link" href={s.href} target="_blank" rel="noreferrer">Open synthetic PDF <Icon name="external" size={15}/></a> : <button disabled={s.status !== "Ready"} onClick={() => ask(`What does ${s.name} say?`)}>Ask this source <Icon name="arrow" size={16}/></button>}</article>)}</div>
  </div>;
}

function Requests({ items, ask }: { items: SupportRequest[]; ask: () => void }) {
  return <div className="content-page"><PageIntro eyebrow="MY REQUESTS" title="Help that stays on track." copy="See every question routed to a support team and follow its progress." action={<button className="button primary" onClick={ask}><Icon name="plus"/>New question</button>}/>
    <div className="metric-row"><Metric label="Total" value={items.length} copy="All submitted requests"/><Metric label="Open" value={items.filter((x) => x.status === "Open").length} copy="Awaiting team action"/><Metric label="In progress" value={items.filter((x) => x.status === "In progress").length} copy="Help is underway"/><Metric label="Resolved" value={items.filter((x) => x.status === "Resolved").length} copy="Closed requests"/></div>
    <div className="table-card"><div className="table-head"><div><h3>Your requests</h3><p>Most recent first</p></div></div><div className="table-scroll"><table><thead><tr><th>Request</th><th>Support team</th><th>Created</th><th>Status</th><th></th></tr></thead><tbody>{items.map((r) => <tr key={r.id}><td><strong>{r.subject}</strong><small>{r.id}</small></td><td>{r.team}</td><td>{r.created}</td><td><RequestStatus status={r.status}/></td><td><button className="row-action"><Icon name="arrow" size={16}/></button></td></tr>)}</tbody></table></div></div>
  </div>;
}

function AdminDashboard({ sources, requests, add, go }: { sources: KnowledgeSource[]; requests: SupportRequest[]; add: () => void; go: (v: View) => void }) {
  const ready = sources.filter((x) => x.status === "Ready").length;
  return <div className="content-page"><PageIntro eyebrow="ADMIN OVERVIEW" title="Keep knowledge useful, trusted, and current." copy="Manage the sources behind every answer and route unresolved questions with confidence." action={<button className="button primary" onClick={add}><Icon name="plus"/>Add data source</button>}/>
    <div className="metric-row"><Metric label="Connected sources" value={sources.length} copy={`${ready} ready for answers`}/><Metric label="Coverage areas" value={new Set(sources.map((s) => s.category)).size} copy="Across employee services"/><Metric label="Open requests" value={requests.filter((r) => r.status !== "Resolved").length} copy="Need team attention"/><Metric label="Trust rate" value="96%" copy="Answers with a cited source"/></div>
    <div className="admin-grid"><section className="panel"><div className="panel-head"><div><span className="eyebrow">KNOWLEDGE HEALTH</span><h3>Source readiness</h3></div><button className="text-button" onClick={() => go("sources")}>Manage <Icon name="arrow" size={15}/></button></div><div className="health-chart"><div className="donut" style={{"--progress": `${Math.round(ready / Math.max(sources.length, 1) * 100) * 3.6}deg`} as React.CSSProperties}><span><strong>{Math.round(ready / Math.max(sources.length, 1) * 100)}%</strong><small>ready</small></span></div><div className="health-list"><span><i className="ready"/>Ready <strong>{ready}</strong></span><span><i className="indexing"/>Indexing <strong>{sources.filter((x) => x.status === "Indexing").length}</strong></span><span><i className="review"/>Needs review <strong>{sources.filter((x) => x.status === "Needs review").length}</strong></span></div></div></section>
      <section className="panel"><div className="panel-head"><div><span className="eyebrow">RECENT ACTIVITY</span><h3>What needs attention</h3></div></div><div className="activity-list"><button onClick={() => go("sources")}><span className="activity-icon bronze"><Icon name="database"/></span><span><strong>One source is still indexing</strong><small>Review connector status and permissions</small></span><Icon name="arrow" size={16}/></button><button onClick={() => go("routing")}><span className="activity-icon blue"><Icon name="route"/></span><span><strong>{requests.filter((r) => r.status !== "Resolved").length} requests need attention</strong><small>Open the team routing queue</small></span><Icon name="arrow" size={16}/></button><button onClick={() => go("analytics")}><span className="activity-icon teal"><Icon name="chart"/></span><span><strong>Trust rate is healthy</strong><small>Review adoption and content gaps</small></span><Icon name="arrow" size={16}/></button></div></section>
    </div>
    <section className="panel connector-panel"><div><span className="eyebrow">TARGET ARCHITECTURE</span><h3>Microsoft-first, backend-ready</h3><p>The demo uses local API adapters. An approved production build can orchestrate answers with a Copilot Studio agent and retrieve permission-aware content from SharePoint, OneDrive, Excel and Azure AI Search.</p></div><div className="connector-flow"><span>Entra ID</span><i>→</i><span>Microsoft 365</span><i>→</i><span>Copilot Studio</span><i>→</i><span>Ask Revantage</span></div></section>
  </div>;
}

function SourcesPanel({ sources, query, setQuery, add }: { sources: KnowledgeSource[]; query: string; setQuery: (v: string) => void; add: () => void }) {
  return <div className="content-page"><PageIntro eyebrow="DATA SOURCES" title="Connect the knowledge people count on." copy="Model realistic source types - SharePoint, OneDrive, Excel, PDFs and websites - while keeping every hackathon record synthetic." action={<button className="button primary" onClick={add}><Icon name="plus"/>Add data source</button>}/>
    <div className="toolbar-card"><label className="search-box"><Icon name="search"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search data sources"/></label><button className="button secondary">All categories</button><span>{sources.length} sources</span></div>
    <div className="table-card"><div className="table-scroll"><table><thead><tr><th>Source</th><th>Type</th><th>Category</th><th>Owner</th><th>Updated</th><th>Status</th><th></th></tr></thead><tbody>{sources.map((s) => <tr key={s.id}><td><div className="source-cell"><span><Icon name={s.type === "SharePoint" || s.type === "OneDrive" || s.type === "Excel" ? "grid" : s.type === "Website" ? "external" : "book"}/></span><div><strong>{s.name}</strong><small>{s.location} · {s.dataClass}</small></div></div></td><td>{s.type}</td><td>{s.category}</td><td>{s.owner}</td><td>{s.updated}</td><td><Status status={s.status}/></td><td><button className="row-action">•••</button></td></tr>)}</tbody></table></div></div>
  </div>;
}

function Routing({ items }: { items: SupportRequest[] }) {
  return <div className="content-page"><PageIntro eyebrow="ROUTING QUEUE" title="Move every question toward resolution." copy="Review classified requests, confirm ownership and keep employees informed."/>
    <div className="routing-board">{(["Open","In progress","Resolved"] as const).map((status) => <section key={status}><div className="board-head"><span>{status}</span><strong>{items.filter((x) => x.status === status).length}</strong></div>{items.filter((x) => x.status === status).map((r) => <article key={r.id}><span className="eyebrow">{r.id}</span><h3>{r.subject}</h3><p>{r.description}</p><div><span>{r.team}</span><small>{r.created}</small></div></article>)}{items.filter((x) => x.status === status).length === 0 && <div className="empty-column">No requests here</div>}</section>)}</div>
  </div>;
}

function Analytics({ sources, requests }: { sources: KnowledgeSource[]; requests: SupportRequest[] }) {
  const groups = [...new Set(sources.map((s) => s.category))];
  return <div className="content-page"><PageIntro eyebrow="INSIGHTS" title="See where knowledge creates value." copy="A focused view of source coverage, employee demand and opportunities to improve."/>
    <div className="metric-row"><Metric label="Questions this week" value="248" copy="Up 18% week over week"/><Metric label="Self-service rate" value="84%" copy="Resolved without a request"/><Metric label="Average response" value="1.8s" copy="Demo response latency"/><Metric label="Open content gaps" value={requests.filter((x) => x.status === "Open").length} copy="From routed questions"/></div>
    <div className="analytics-grid"><section className="panel"><div className="panel-head"><div><span className="eyebrow">COVERAGE</span><h3>Sources by service area</h3></div></div><div className="bars">{groups.map((g, i) => { const count = sources.filter((s) => s.category === g).length; return <div key={g}><span>{g}</span><div><i style={{width: `${Math.min(100, count * 38 + 20)}%`}}/></div><strong>{count}</strong></div>; })}</div></section><section className="panel"><div className="panel-head"><div><span className="eyebrow">TOP INTENTS</span><h3>What employees need</h3></div></div><ol className="intent-list"><li><span>Cab facility & travel</span><strong>32%</strong></li><li><span>Leave & holidays</span><strong>27%</strong></li><li><span>Access & technology</span><strong>19%</strong></li><li><span>Expenses</span><strong>14%</strong></li><li><span>Other</span><strong>8%</strong></li></ol></section></div>
  </div>;
}

function PageIntro({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy: string; action?: React.ReactNode }) { return <div className="page-intro"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{copy}</p></div>{action}</div>; }
function Metric({ label, value, copy }: { label: string; value: string | number; copy: string }) { return <div className="metric"><span>{label}</span><strong>{value}</strong><small>{copy}</small></div>; }
function Status({ status }: { status: KnowledgeSource["status"] }) { return <span className={`status ${status.toLowerCase().replace(" ", "-")}`}><i/>{status}</span>; }
function RequestStatus({ status }: { status: SupportRequest["status"] }) { return <span className={`status request-${status.toLowerCase().replace(" ", "-")}`}><i/>{status}</span>; }
