import Link from "next/link";
import { Panel, SalonTitle, TxList } from "@/components/salon/ui";
import { categories, fmtCents } from "@/lib/banking-labels";
import { searchTransactions } from "@/lib/server/banking";
import { all } from "@/lib/server/db";
import { requireMember } from "@/lib/server/member-auth";

export const metadata = { title: "Opérations" };

type SP = { q?: string; kind?: string; category?: string; month?: string; page?: string };

export default async function OperationsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const m = await requireMember();
  const sp = await searchParams;
  const { rows, total, page, pages } = searchTransactions(m.id, { ...sp, page: Number(sp.page) || 1 });
  const months = all<{ ym: string }>("SELECT DISTINCT substr(created_at, 1, 7) ym FROM transactions WHERE member_id = ? ORDER BY ym DESC", m.id);
  const totals = rows.reduce(
    (acc, r) => (r.status === "ok" ? (r.amount_cents > 0 ? { ...acc, in: acc.in + r.amount_cents } : { ...acc, out: acc.out + r.amount_cents }) : acc),
    { in: 0, out: 0 },
  );
  const monthName = (ym: string) => new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(`${ym}-15`));
  const qs = (p: number) => `?${new URLSearchParams(Object.entries({ ...sp, page: String(p) }).filter(([, v]) => v) as [string, string][])}`;

  return (
    <div>
      <SalonTitle eyebrow="Compte principal" title="Opérations" />

      <form className="mb-6 flex flex-wrap gap-2" role="search">
        <input name="q" defaultValue={sp.q} placeholder="Rechercher un marchand, un nom…" className="s-input h-11 min-w-[200px] flex-1" />
        <select name="kind" defaultValue={sp.kind ?? ""} className="s-input h-11 w-auto">
          <option value="">Tout</option>
          <option value="in">Entrées</option>
          <option value="out">Sorties</option>
          <option value="refusee">Refusées</option>
        </select>
        <select name="category" defaultValue={sp.category ?? ""} className="s-input h-11 w-auto">
          <option value="">Catégories</option>
          {Object.entries(categories).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <select name="month" defaultValue={sp.month ?? ""} className="s-input h-11 w-auto">
          <option value="">Tous les mois</option>
          {months.map((mo) => (
            <option key={mo.ym} value={mo.ym} className="capitalize">
              {monthName(mo.ym)}
            </option>
          ))}
        </select>
        <button className="btn btn-gold btn-sm h-11">
          <span>Filtrer</span>
        </button>
      </form>

      <Panel
        title={`${total} opération${total > 1 ? "s" : ""}`}
        action={
          <div className="flex gap-4 font-mono text-xs tabular-nums">
            <span className="text-gold-light">{fmtCents(totals.in, true)}</span>
            <span className="text-white/70">{fmtCents(totals.out)}</span>
          </div>
        }
      >
        <TxList rows={rows} />
        {pages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-[var(--s-line)] pt-4 text-sm">
            <span className="text-[var(--s-muted)]">
              Page {page} / {pages}
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={qs(page - 1)} className="rounded-full border border-[var(--s-line)] px-4 py-1.5 hover:border-white/25">
                  Précédent
                </Link>
              )}
              {page < pages && (
                <Link href={qs(page + 1)} className="rounded-full border border-[var(--s-line)] px-4 py-1.5 hover:border-white/25">
                  Suivant
                </Link>
              )}
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
