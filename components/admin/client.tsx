"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Logo } from "@/components/Logo";
import { roleLabel } from "@/lib/labels";

/** Submit button that disables itself while the server action runs, with optional confirm(). */
export function Submit({ children, className, confirm }: { children: ReactNode; className: string; confirm?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending ? "…" : children}
    </button>
  );
}

const nav = [
  { href: "/admin", label: "Tableau de bord", icon: "M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z" },
  { href: "/admin/demandes", label: "Demandes", icon: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4", badge: "pending" },
  { href: "/admin/membres", label: "Membres", icon: "M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35M15.5 4.15a3.5 3.5 0 0 1 0 6.7" },
  { href: "/admin/conciergerie", label: "Conciergerie", icon: "M4 18h16M6 18v-3a6 6 0 0 1 12 0v3M12 9V7M10 21h4", badge: "concierge" },
  { href: "/admin/equipe", label: "Équipe", icon: "M12 3 4.5 6v6c0 4.5 3.2 7.8 7.5 9 4.3-1.2 7.5-4.5 7.5-9V6z", superOnly: true },
  { href: "/admin/journal", label: "Journal d'audit", icon: "M4 6h16M4 12h16M4 18h10", superOnly: true },
  { href: "/admin/parametres", label: "Paramètres", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z", superOnly: true },
];

export function Sidebar({
  admin,
  pending,
  concierge = 0,
  logout,
}: {
  admin: { name: string; email: string; role: "super_admin" | "analyste" };
  pending: number;
  concierge?: number;
  logout: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = nav.filter((n) => !n.superOnly || admin.role === "super_admin");

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/admin" onClick={() => setOpen(false)}>
          <Logo light />
        </Link>
        <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-[10px] tracking-[0.18em] text-gold-light">ADMIN</span>
      </div>
      <nav className="mt-2 flex-1 space-y-1 px-3" aria-label="Administration">
        {items.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
              isActive(n.href) ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
            aria-current={isActive(n.href) ? "page" : undefined}
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={n.icon} />
            </svg>
            <span className="flex-1">{n.label}</span>
            {n.badge && (n.badge === "concierge" ? concierge : pending) > 0 && (
              <span className="rounded-full bg-gold px-2 py-0.5 text-[11px] font-semibold tabular-nums text-ink">
                {n.badge === "concierge" ? concierge : pending}
              </span>
            )}
          </Link>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <Link href="/admin/compte" onClick={() => setOpen(false)} className="block rounded-xl px-2 py-2 hover:bg-white/5">
          <div className="truncate text-sm text-white">{admin.name}</div>
          <div className="truncate text-xs text-white/50">
            {roleLabel[admin.role]} · {admin.email}
          </div>
        </Link>
        <div className="mt-2 flex gap-2 px-2 text-xs">
          <Link href="/" className="text-white/50 hover:text-white">
            Voir le site
          </Link>
          <span className="text-white/20">·</span>
          <form action={logout}>
            <button type="submit" className="text-white/50 hover:text-white">
              Se déconnecter
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-ink lg:block">{content}</aside>

      <div className="sticky top-0 z-30 flex items-center justify-between bg-ink px-4 py-3 lg:hidden">
        <Logo light />
        <button type="button" onClick={() => setOpen(true)} className="rounded-lg px-3 py-1.5 text-sm text-white ring-1 ring-white/20" aria-expanded={open}>
          Menu
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Fermer le menu" onClick={() => setOpen(false)} />
          <aside className="step-in absolute inset-y-0 left-0 w-72 bg-ink">{content}</aside>
        </div>
      )}
    </>
  );
}

/** Collapsible panel for a decision form (validate / refuse / complement). */
export function ActionPanel({ label, className, children }: { label: string; className: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" className={`${className} w-full`} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {label}
      </button>
      {open && <div className="step-in mt-3 rounded-xl border border-line bg-mist/60 p-4">{children}</div>}
    </div>
  );
}

/** Single-series bar chart (applications per day). One hue, hover tooltip, accessible table. */
export function DailyBars({ data }: { data: { d: string; n: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((x) => x.n));
  const W = 600;
  const H = 180;
  const pad = { l: 28, r: 8, t: 12, b: 24 };
  const bw = (W - pad.l - pad.r) / data.length;
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const ticks = Array.from(new Set([0, Math.ceil(max / 2), max]));
  const fmt = (d: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(d));

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Demandes reçues par jour sur 30 jours">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#e9e6df" strokeWidth="1" />
            <text x={pad.l - 6} y={y(t) + 3} textAnchor="end" fontSize="10" fill="#6a675f">
              {t}
            </text>
          </g>
        ))}
        {data.map((x, i) => {
          const h = H - pad.b - y(x.n);
          const bx = pad.l + i * bw + 2;
          const w = Math.max(2, bw - 4);
          return (
            <g key={x.d} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={pad.l + i * bw} y={pad.t} width={bw} height={H - pad.t - pad.b} fill="transparent" />
              {x.n > 0 && (
                <path
                  d={`M${bx},${H - pad.b} v${-Math.max(0, h - 4)} q0,-4 4,-4 h${w - 8} q4,0 4,4 v${Math.max(0, h - 4)} z`}
                  fill={hover === i ? "#8c6b12" : "#c9a233"}
                />
              )}
            </g>
          );
        })}
        {[0, 14, 29].map((i) => (
          <text key={i} x={pad.l + i * bw + bw / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="#6a675f">
            {fmt(data[i].d)}
          </text>
        ))}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-xs text-white shadow-lg"
          style={{ left: `${((pad.l + hover * bw + bw / 2) / W) * 100}%` }}
        >
          {fmt(data[hover].d)} · <strong>{data[hover].n}</strong> demande{data[hover].n > 1 ? "s" : ""}
        </div>
      )}
      <table className="sr-only">
        <caption>Demandes reçues par jour</caption>
        <tbody>
          {data.map((x) => (
            <tr key={x.d}>
              <th scope="row">{x.d}</th>
              <td>{x.n}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
