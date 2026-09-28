"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

const I = {
  home: "M3 11 12 4l9 7M5 10v10h5v-6h4v6h5V10",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  send: "M22 2 11 13M22 2l-7 20-4-9-9-4z",
  card: "M2.5 5h19v14h-19zM2.5 10h19M6 15h4",
  vault: "M3 4h18v16H3zM12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM12 8.5V7M12 17v-1.5",
  bell: "M4 18h16M6 18v-3a6 6 0 0 1 12 0v3M12 9V7M10 21h4",
  star: "M12 3l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.9L6.6 19.6l1-6L3.3 9.4l6-.9z",
  doc: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5",
  lock: "M5 10.5h14v10H5zM8 10.5V8a4 4 0 0 1 8 0v2.5",
  more: "M5 12h.01M12 12h.01M19 12h.01",
};

const items = [
  { href: "/espace", label: "Accueil", icon: I.home },
  { href: "/espace/operations", label: "Opérations", icon: I.list },
  { href: "/espace/virements", label: "Virements", icon: I.send },
  { href: "/espace/carte", label: "Ma carte", icon: I.card },
  { href: "/espace/coffres", label: "Coffres", icon: I.vault },
  { href: "/espace/conciergerie", label: "Conciergerie", icon: I.bell, badge: true },
  { href: "/espace/privileges", label: "Privilèges", icon: I.star },
  { href: "/espace/documents", label: "Documents", icon: I.doc },
  { href: "/espace/securite", label: "Sécurité", icon: I.lock },
];

const Icon = ({ d, className = "h-5 w-5" }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const IDLE_MS = 30 * 60_000;

export function SalonNav({
  member,
  unread,
  logout,
}: {
  member: { prenom: string; nom: string; member_number: string; offer: string };
  unread: number;
  logout: () => Promise<void>;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [more, setMore] = useState(false);
  const active = (href: string) => (href === "/espace" ? pathname === "/espace" : pathname.startsWith(href));

  useEffect(() => setMore(false), [pathname]);

  // Idle timeout mirrors the server-side 30 min session expiry.
  useEffect(() => {
    let t = window.setTimeout(() => router.replace("/espace/connexion?expiree=1"), IDLE_MS);
    const bump = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => router.replace("/espace/connexion?expiree=1"), IDLE_MS);
    };
    const evs = ["pointerdown", "keydown", "scroll"] as const;
    evs.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    return () => {
      window.clearTimeout(t);
      evs.forEach((e) => window.removeEventListener(e, bump));
    };
  }, [router]);

  const tier = member.offer === "gold" ? "OR" : member.offer === "platine" ? "PLATINE" : "NOIRE";

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r border-[var(--s-line)] bg-[#0c0c0e]/80 backdrop-blur-xl lg:flex">
        <div className="px-6 pb-6 pt-7">
          <Link href="/espace">
            <Logo light />
          </Link>
        </div>
        <nav className="flex-1 space-y-0.5 px-3" aria-label="Le Salon">
          {items.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active(n.href) ? "page" : undefined}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.92rem] transition-colors ${
                active(n.href) ? "bg-white/[0.06] text-white" : "text-white/55 hover:text-white"
              }`}
            >
              {active(n.href) && <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-gold" />}
              <Icon d={n.icon} className={`h-[18px] w-[18px] ${active(n.href) ? "text-gold-light" : ""}`} />
              <span className="flex-1">{n.label}</span>
              {n.badge && unread > 0 && <span className="rounded-full bg-gold px-1.5 text-[11px] font-semibold text-ink">{unread}</span>}
            </Link>
          ))}
        </nav>
        <div className="m-3 rounded-2xl border border-[var(--s-line)] p-4">
          <div className="text-sm font-medium">
            {member.prenom} {member.nom}
          </div>
          <div className="mt-0.5 font-mono text-[11px] tracking-[0.14em] text-gold-light/80">
            {tier} · {member.member_number}
          </div>
          <form action={logout} className="mt-3">
            <button className="text-xs text-white/50 hover:text-white">Se déconnecter</button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-[var(--s-line)] bg-[#09090a]/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Logo light />
        <span className="font-mono text-[10px] tracking-[0.18em] text-gold-light/80">{tier}</span>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        className="no-print fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[var(--s-line)] bg-[#0c0c0e]/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
        aria-label="Navigation"
      >
        {[items[0], items[1], items[2], items[3]].map((n, i) => (
          <Link
            key={n.href}
            href={n.href}
            className={`flex flex-col items-center gap-1 py-2.5 text-[10px] ${active(n.href) ? "text-gold-light" : "text-white/50"}`}
          >
            {i === 2 ? (
              <span className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#b8912a] via-[#f5e6b8] to-[#c9a233] text-ink shadow-[0_8px_24px_-6px_rgba(212,175,55,0.6)]">
                <Icon d={n.icon} />
              </span>
            ) : (
              <Icon d={n.icon} />
            )}
            {n.label}
          </Link>
        ))}
        <button type="button" onClick={() => setMore(true)} className="order-last flex flex-col items-center gap-1 py-2.5 text-[10px] text-white/50">
          <span className="relative">
            <Icon d={I.more} />
            {unread > 0 && <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-gold" />}
          </span>
          Plus
        </button>
      </nav>

      {more && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Plus">
          <button className="sheet-backdrop absolute inset-0 bg-black/60" aria-label="Fermer" onClick={() => setMore(false)} />
          <div className="sheet-panel absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-[var(--s-line)] bg-[#131316] p-5 pb-[calc(env(safe-area-inset-bottom)+20px)]">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />
            <div className="grid grid-cols-3 gap-3">
              {items.slice(4).map((n) => (
                <Link key={n.href} href={n.href} className="relative flex flex-col items-center gap-2 rounded-2xl bg-white/[0.04] py-4 text-xs text-white/80">
                  <Icon d={n.icon} className="h-6 w-6 text-gold-light" />
                  {n.label}
                  {n.badge && unread > 0 && <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-gold" />}
                </Link>
              ))}
              <form action={logout} className="contents">
                <button className="flex flex-col items-center gap-2 rounded-2xl bg-white/[0.04] py-4 text-xs text-white/60">
                  <Icon d="M15 12H3M11 8l-4 4 4 4M21 4v16" className="h-6 w-6" />
                  Déconnexion
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
