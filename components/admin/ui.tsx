import Link from "next/link";
import type { ReactNode } from "react";
import { actionLabel, fmtDate, toneClass, toneDot } from "@/lib/labels";
import type { EventRow } from "@/lib/server/admin-data";

type Tone = keyof typeof toneClass;

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${toneClass[tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${toneDot[tone]}`} aria-hidden="true" />
      {children}
    </span>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, action, children, className = "", pad = true }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={`rounded-2xl border border-line bg-white ${className}`}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action}
        </header>
      )}
      <div className={pad ? "p-5" : ""}>{children}</div>
    </section>
  );
}

/** Success / error banner driven by ?ok= / ?erreur= after a server action. */
export function Flash({ ok, erreur }: { ok?: string; erreur?: string }) {
  if (!ok && !erreur) return null;
  return (
    <div
      role={erreur ? "alert" : "status"}
      className={`step-in rounded-2xl px-4 py-3 text-sm ring-1 ring-inset ${erreur ? toneClass.critical : toneClass.good}`}
    >
      {erreur ?? ok}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-5 py-14 text-center text-sm text-muted">{children}</div>;
}

export function Pagination({ page, pages, base, params }: { page: number; pages: number; base: string; params: Record<string, string | undefined> }) {
  if (pages <= 1) return null;
  const href = (p: number) => {
    const qs = new URLSearchParams(Object.entries({ ...params, page: String(p) }).filter(([, v]) => v) as [string, string][]);
    return `${base}?${qs}`;
  };
  return (
    <nav className="flex items-center justify-between border-t border-line px-5 py-3 text-sm" aria-label="Pagination">
      <span className="text-muted">
        Page {page} sur {pages}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link href={href(page - 1)} className="rounded-lg border border-line px-3 py-1.5 hover:bg-mist">
            Précédent
          </Link>
        )}
        {page < pages && (
          <Link href={href(page + 1)} className="rounded-lg border border-line px-3 py-1.5 hover:bg-mist">
            Suivant
          </Link>
        )}
      </div>
    </nav>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "warning" | "critical" }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted">{label}</div>
      <div className="mt-3 font-display text-3xl font-semibold tabular-nums tracking-tight">{value}</div>
      {hint && <div className={`mt-1.5 text-xs ${tone === "critical" ? "text-[#a33a2a]" : tone === "warning" ? "text-[#8a5a00]" : "text-muted"}`}>{hint}</div>}
    </div>
  );
}

export function Timeline({ events, showEntity = false }: { events: EventRow[]; showEntity?: boolean }) {
  if (!events.length) return <Empty>Aucun événement.</Empty>;
  return (
    <ol className="space-y-4">
      {events.map((e) => (
        <li key={e.id} className="flex gap-3">
          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${e.actor_type === "candidat" ? "bg-[#2b4a8a]" : e.actor_type === "admin" ? "bg-gold" : "bg-ink/30"}`} />
          <div className="min-w-0 text-sm">
            <div>
              <span className="font-medium">{actionLabel[e.action] ?? e.action}</span>
              {showEntity && e.entity_id && (
                <Link
                  href={e.entity_type === "member" ? `/admin/membres/${e.entity_id}` : `/admin/demandes/${e.entity_id}`}
                  className="ml-1.5 text-gold-deep hover:underline"
                >
                  #{e.entity_id}
                </Link>
              )}
              {e.public ? <span className="ml-2 rounded bg-[#e8eefb] px-1.5 py-0.5 text-[10px] text-[#2b4a8a]">visible candidat</span> : null}
            </div>
            {e.detail && <p className="mt-0.5 whitespace-pre-line break-words text-muted">{e.detail}</p>}
            <div className="mt-0.5 text-xs text-muted">
              {e.actor_type === "admin" ? e.admin_name ?? "Admin" : e.actor_type === "candidat" ? "Candidat" : e.actor_type === "membre" ? "Membre" : "Système"} ·{" "}
              {fmtDate(e.created_at, true)}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export const inputCls =
  "h-10 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none transition-[border-color,box-shadow] focus:border-gold focus:shadow-[0_0_0_3px_rgba(212,175,55,0.15)]";
export const textareaCls =
  "w-full rounded-xl border border-line bg-white p-3 text-sm outline-none transition-[border-color,box-shadow] focus:border-gold focus:shadow-[0_0_0_3px_rgba(212,175,55,0.15)]";
export const btn = {
  primary: "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm font-medium text-white transition-colors hover:bg-ink-2 disabled:opacity-50",
  gold: "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#b8912a] via-[#e8cd7a] to-[#c9a233] px-4 text-sm font-medium text-ink shadow-sm transition-shadow hover:shadow-md disabled:opacity-50",
  ghost: "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-medium transition-colors hover:bg-mist disabled:opacity-50",
  danger: "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#a33a2a]/25 bg-white px-4 text-sm font-medium text-[#a33a2a] transition-colors hover:bg-[#fbe6e3] disabled:opacity-50",
};
