"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BookIcon, CloseIcon, MenuIcon, MessageIcon, MoonIcon, PanelIcon, PeopleIcon, SettingsIcon, SunIcon } from "@/components/icons";

const navigation = [
  { href: "/", label: "Ask", icon: MessageIcon },
  { href: "/knowledge", label: "Knowledge Library", icon: BookIcon },
  { href: "/people", label: "People Directory", icon: PeopleIcon },
  { href: "/admin", label: "Admin Dashboard", icon: SettingsIcon },
];

function titleFor(pathname: string) {
  if (pathname.startsWith("/knowledge")) return "Knowledge Library";
  if (pathname.startsWith("/people") || pathname.startsWith("/support")) return "People Directory";
  if (pathname.startsWith("/admin")) return "Admin Dashboard";
  return "Ask Revantage";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("ask-revantage-theme");
    const shouldUseDark = saved === "dark" || (!saved && matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(shouldUseDark);
    document.documentElement.dataset.theme = shouldUseDark ? "dark" : "light";
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("ask-revantage-theme", next ? "dark" : "light");
  }

  return <div className="app-shell">
    {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <aside className={`sidebar ${collapsed ? "is-collapsed" : ""} ${mobileOpen ? "is-open" : ""}`}>
      <div className="sidebar-brand">
        <Link href="/" className="brand-mark" aria-label="Ask Revantage home">
          <span className="brand-r">R</span><Image className="brand-logo" src="/assets/ask-revantage-wordmark.png" alt="Ask Revantage" width={600} height={134} priority/>
        </Link>
        <button className="icon-button sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><CloseIcon size={18}/></button>
      </div>
      <div className="nav-label">Workspace</div>
      <nav className="primary-nav" aria-label="Primary navigation">
        {navigation.map(({ href, label, icon: NavIcon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href) || (href === "/people" && pathname.startsWith("/support"));
          return <Link key={href} href={href} className={`nav-link ${active ? "active" : ""}`} aria-current={active ? "page" : undefined} onClick={() => setMobileOpen(false)}>
            <span className="nav-icon"><NavIcon size={19}/></span><span className="nav-text">{label}</span>
          </Link>;
        })}
      </nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-user">
        <Image src="/assets/shruti-gupta-avatar.jpg" alt="Shruti Gupta" width={38} height={38}/>
        <div className="nav-text"><strong>Shruti Gupta</strong><span>Corporate Tax</span></div>
      </div>
      <button className="collapse-button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}>
        <PanelIcon size={18}/><span className="nav-text">{collapsed ? "" : "Collapse"}</span>
      </button>
    </aside>
    <main className="main-panel">
      <header className="topbar">
        <div className="topbar-left">
          <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><MenuIcon size={20}/></button>
          <div><h1>{titleFor(pathname)}</h1><p>One question. One place. One answer.</p></div>
        </div>
        <div className="topbar-actions">
          <button className="icon-button" onClick={toggleTheme} aria-label={dark ? "Use light theme" : "Use dark theme"}>{dark ? <SunIcon size={19}/> : <MoonIcon size={19}/>}</button>
          <Image className="topbar-avatar" src="/assets/shruti-gupta-avatar.jpg" alt="Shruti Gupta" width={34} height={34}/>
        </div>
      </header>
      <div className="workspace">{children}</div>
    </main>
  </div>;
}
