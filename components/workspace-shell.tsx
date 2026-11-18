"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminIcon, BookIcon, ChatIcon, MenuIcon, MoonIcon, PeopleIcon, SunIcon } from "./icons";

const links = [
  { href: "/", label: "Ask Revant Bot", icon: ChatIcon },
  { href: "/knowledge", label: "Knowledge Library", icon: BookIcon },
  { href: "/people", label: "People Directory", icon: PeopleIcon },
  { href: "/admin", label: "Admin Dashboard", icon: AdminIcon }
];

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("ask-revantage-theme");
    const preferred = matchMedia("(prefers-color-scheme: dark)").matches;
    const next = saved ? saved === "dark" : preferred;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
  }, []);
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("ask-revantage-theme", next ? "dark" : "light");
  };
  const admin = pathname === "/admin";

  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? "open" : ""}`} aria-label="Primary navigation">
      <Link href="/" className="brand-lockup" onClick={() => setMenuOpen(false)}>
        <Image src="/assets/ask-revantage-logo.jpg" alt="Ask Revantage" width={200} height={112} priority />
      </Link>
      <nav className="sidebar-nav">
        <span className="nav-label">Workspace</span>
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return <Link key={href} href={href} className={`nav-link ${active ? "active" : ""}`} onClick={() => setMenuOpen(false)}>
            <Icon aria-hidden="true" /><span>{label}</span>
          </Link>;
        })}
      </nav>
      <div className="sidebar-note"><strong>Hackathon demo</strong><span>Fictional knowledge content</span></div>
    </aside>
    {menuOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    <section className="main-panel">
      <header className="topbar">
        <button className="icon-button mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><MenuIcon /></button>
        <div className="topbar-title">{links.find(item => item.href === pathname)?.label || "Ask Revantage"}</div>
        <div className="topbar-actions">
          <button className="theme-toggle" onClick={toggleTheme} aria-label={`Use ${dark ? "light" : "dark"} mode`}>
            {dark ? <SunIcon /> : <MoonIcon />}<span>{dark ? "Light" : "Dark"}</span>
          </button>
          <div className="profile">
            <Image src={admin ? "/assets/admin-user.png" : "/assets/shruti-gupta-avatar.jpg"} alt="" width={36} height={36} />
            <div><strong>{admin ? "Ethan Brooks" : "Shruti Gupta"}</strong><span>{admin ? "Admin user" : "Employee"}</span></div>
          </div>
        </div>
      </header>
      <main className="page-frame">{children}</main>
    </section>
  </div>;
}
