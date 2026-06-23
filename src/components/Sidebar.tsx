"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Dashboard", icon: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" },
  { href: "/clients", label: "Clientes", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { href: "/negotiations", label: "IA negociando", icon: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" },
  { href: "/settings", label: "Regras", icon: "M12 15a3 3 0 100-6 3 3 0 000 6zm7.4-3a7.4 7.4 0 00-.1-1.2l2.1-1.6-2-3.5-2.5 1a7.3 7.3 0 00-2-1.2l-.4-2.7h-4l-.4 2.7a7.3 7.3 0 00-2 1.2l-2.5-1-2 3.5 2.1 1.6a7.4 7.4 0 000 2.4l-2.1 1.6 2 3.5 2.5-1a7.3 7.3 0 002 1.2l.4 2.7h4l.4-2.7a7.3 7.3 0 002-1.2l2.5 1 2-3.5-2.1-1.6c.06-.4.1-.8.1-1.2z" },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="hidden md:flex w-56 shrink-0 border-r border-border bg-surface min-h-screen flex-col">
      <div className="px-5 py-5 flex items-center gap-2 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-brand/15 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#378add" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        </div>
        <div>
          <div className="font-medium text-[15px] leading-none">Recuper<span className="text-brand">.ai</span></div>
          <div className="text-[10px] text-faint mt-1">agente financeiro</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => {
          const active = path === item.href;
          return (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${active ? "bg-surface2 text-ink font-medium" : "text-muted hover:text-ink hover:bg-surface2/50"}`}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-border">
        <div className="flex items-center gap-2 text-[11px] text-success">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />IA ativa
        </div>
        <div className="text-[10px] text-faint mt-1">Clinica OdontoVida</div>
      </div>
    </aside>
  );
}
