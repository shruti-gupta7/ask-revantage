"use client";

import { useMemo, useState } from "react";
import { ExternalIcon, SearchIcon } from "./icons";

const people = [
  ["Maya Rao", "People Operations", "Benefits and employee support", "maya.rao@example.com"],
  ["Ethan Brooks", "Technology", "Ask Revantage administration", "ethan.brooks@example.com"],
  ["Noah Williams", "Workplace Mobility", "Cab and transport support", "noah.williams@example.com"],
  ["Aisha Khan", "Travel & Expense", "Travel policy and reimbursement", "aisha.khan@example.com"],
  ["Liam Chen", "Security Operations", "Security incidents and awareness", "liam.chen@example.com"],
  ["Priya Mehta", "Workplace Access", "Badges and office access", "priya.mehta@example.com"],
  ["Sofia Martinez", "Payroll", "Payroll questions", "sofia.martinez@example.com"],
  ["Oliver Jones", "Technology Help Desk", "Devices and application access", "oliver.jones@example.com"]
];

export function PeopleView() {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => people.filter(person => person.join(" ").toLowerCase().includes(query.toLowerCase())), [query]);
  return <section className="content-page">
    <div className="page-heading"><div><span className="eyebrow">Find the right person</span><h1>People Directory</h1><p>Demo contacts for common employee support areas.</p></div><span className="count-badge">Fictional directory</span></div>
    <div className="search-box glass-card"><SearchIcon /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, team, role or support area" aria-label="Search people directory" /></div>
    <div className="people-grid">{visible.map(([name, team, area, email]) => <article className="person-card glass-card" key={name}>
      <div className="initial-avatar">{name.split(" ").map(part => part[0]).join("")}</div>
      <div className="person-info"><h2>{name}</h2><span>{team}</span><p>{area}</p></div>
      <a className="button secondary" href={`https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(email)}`} target="_blank" rel="noreferrer">Open Teams <ExternalIcon /></a>
    </article>)}</div>
  </section>;
}
