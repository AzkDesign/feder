import Link from "next/link";
import type { ReactNode } from "react";
import { categories, fmtCents, kindLabel } from "@/lib/banking-labels";
import type { TxRow } from "@/lib/server/banking";

export function SalonTitle({ eyebrow, title, action }: { eyebrow?: string; title: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold-light/75">{eyebrow}</div>}
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em] md:text-4xl">{title}</h1>
      </div>
      {action}
    </div>
  );
}

export function Panel({ title, action, children, className = "" }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`s-card p-5 md:p-6 ${className}`}>
      {(title || action) && (
        <header className="mb-5 flex items-center justify-between gap-3">
          {title && <h2 className="text-sm font-medium text-white/80">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

const kindIcon: Record<string, string> = {
  deposit: "M12 19V5M5 12l7-7 7 7",
  transfer_in: "M12 5v14M19 12l-7 7-7-7",
  transfer_out: "M22 2 11 13M22 2l-7 20-4-9-9-4z",
  feder_pay_in: "M12 5v14M19 12l-7 7-7-7",
  feder_pay_out: "M22 2 11 13M22 2l-7 20-4-9-9-4z",
  vault_in: "M3 4h18v16H3zM12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
  vault_out: "M3 4h18v16H3zM12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
  cashback: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18",
  withdrawal: "M3 7h18v10H3zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
};

export function TxIcon({ tx }: { tx: Pick<TxRow, "kind" | "category" | "status"> }) {
  const d = tx.kind === "card" ? categories[tx.category ?? "autre"]?.icon ?? categories.autre.icon : kindIcon[tx.kind] ?? categories.autre.icon;
  const positive = ["deposit", "transfer_in", "feder_pay_in", "cashback", "vault_out"].includes(tx.kind);
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
        tx.status === "refusee" ? "bg-[#3a1512] text-[#ff9b8a]" : positive ? "bg-gold/15 text-gold-light" : "bg-white/[0.06] text-white/70"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={d} />
      </svg>
    </span>
  );
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const y = new Date(Date.now() - 86400_000);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === y.toDateString()) return "Hier";
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(d);
}

export function TxList({ rows, grouped = true }: { rows: TxRow[]; grouped?: boolean }) {
  if (!rows.length) {
    return <p className="py-10 text-center text-sm text-[var(--s-muted)]">Aucune opération pour le moment.</p>;
  }
  const groups: [string, TxRow[]][] = [];
  for (const r of rows) {
    const k = grouped ? dayLabel(r.created_at) : "";
    const last = groups[groups.length - 1];
    if (last && last[0] === k) last[1].push(r);
    else groups.push([k, [r]]);
  }
  return (
    <div className="space-y-6">
      {groups.map(([day, list]) => (
        <div key={day + list[0].id}>
          {grouped && <div className="mb-2 text-xs capitalize text-[var(--s-muted)]">{day}</div>}
          <ul className="divide-y divide-[var(--s-line)]">
            {list.map((t) => (
              <li key={t.id} className="flex items-center gap-4 py-3">
                <TxIcon tx={t} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[0.95rem]">{t.label}</div>
                  <div className="truncate text-xs text-[var(--s-muted)]">
                    {t.status === "refusee" ? `Refusé · ${t.note}` : t.kind === "card" ? categories[t.category ?? "autre"]?.label : kindLabel[t.kind]}
                    {t.status !== "refusee" && t.note ? ` · ${t.note}` : ""}
                  </div>
                </div>
                <div
                  className={`shrink-0 font-mono text-sm tabular-nums ${
                    t.status === "refusee" ? "text-white/35 line-through" : t.amount_cents > 0 ? "text-gold-light" : "text-white/90"
                  }`}
                >
                  {fmtCents(t.amount_cents, true)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function QuickAction({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link href={href} className="group flex flex-col items-center gap-2 text-xs text-white/70 hover:text-white">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--s-line)] bg-white/[0.04] transition-[border-color,background-color] duration-300 group-hover:border-gold/40 group-hover:bg-gold/10">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-gold-light" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={icon} />
        </svg>
      </span>
      {label}
    </Link>
  );
}

export function ErrorNote({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="step-in rounded-xl bg-[#3a1512] px-4 py-3 text-sm text-[#ffb4a8]">
      {children}
    </p>
  );
}

export function OkNote({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="status" className="step-in rounded-xl bg-gold/10 px-4 py-3 text-sm text-gold-light">
      {children}
    </p>
  );
}
