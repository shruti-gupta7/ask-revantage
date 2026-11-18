"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { MailIcon, SearchIcon } from "@/components/icons";

const people = [
  { name: "Shruti Gupta", role: "Senior Accountant, Corporate Tax", department: "Corporate Tax", location: "Bangalore", expertise: ["Tax", "Workpapers"], email: "shruti.gupta@example.com", image: "/assets/shruti-gupta-avatar.jpg" },
  { name: "Ethan Brooks", role: "People Operations Partner", department: "People & Culture", location: "Chicago", expertise: ["Leave", "Benefits"], email: "ethan.brooks@example.com", image: "/assets/ethan-brooks-avatar.png" },
  { name: "Maya Patel", role: "Workplace Experience Lead", department: "Workplace", location: "Bangalore", expertise: ["Cab policy", "Office access"], email: "maya.patel@example.com", initials: "MP" },
  { name: "Oliver Chen", role: "Technology Support Manager", department: "Technology", location: "New York", expertise: ["Devices", "Access"], email: "oliver.chen@example.com", initials: "OC" },
  { name: "Sofia Ramirez", role: "Travel Programme Manager", department: "Operations", location: "Chicago", expertise: ["Travel", "Expenses"], email: "sofia.ramirez@example.com", initials: "SR" },
  { name: "Noah Williams", role: "Compliance Business Partner", department: "Risk & Compliance", location: "London", expertise: ["Compliance", "Controls"], email: "noah.williams@example.com", initials: "NW" },
  { name: "Ava Thompson", role: "Learning and Development Lead", department: "People & Culture", location: "Philadelphia", expertise: ["Learning", "Onboarding"], email: "ava.thompson@example.com", initials: "AT" },
  { name: "Liam Foster", role: "Finance Operations Director", department: "Finance", location: "London", expertise: ["Finance", "Approvals"], email: "liam.foster@example.com", initials: "LF" },
];

export function PeopleView() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => people.filter((person) => Object.values(person).flat().join(" ").toLowerCase().includes(query.toLowerCase())), [query]);
  return <section className="page-content people-page">
    <div className="page-heading"><div><span className="eyebrow">FIND THE RIGHT PERSON</span><h2>People Directory</h2><p>Connect with fictional demo specialists for policy and process support.</p></div></div>
    <label className="search-field directory-search"><SearchIcon size={18}/><span className="sr-only">Search people</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, team, location, or expertise"/></label>
    <div className="people-grid">{filtered.map((person) => <article className="person-card" key={person.email}>
      <div className="person-photo">{person.image ? <Image src={person.image} alt={person.name} width={72} height={72}/> : <span>{person.initials}</span>}</div>
      <div className="person-copy"><h3>{person.name}</h3><p className="person-role">{person.role}</p><p className="person-meta">{person.department} · {person.location}</p><div className="expertise">{person.expertise.map((item) => <span key={item}>{item}</span>)}</div></div>
      <a className="email-action" href={`mailto:${person.email}?subject=${encodeURIComponent("Ask Revantage support question")}`} aria-label={`Email ${person.name}`} title={`Email ${person.name}`}><MailIcon size={20}/></a>
    </article>)}</div>
    {!filtered.length && <div className="empty-state"><h3>No people found</h3><p>Try a broader name, department, or location.</p></div>}
    <p className="demo-note">All directory profiles and email addresses on this page are fictional and provided only for the demonstration.</p>
  </section>;
}
