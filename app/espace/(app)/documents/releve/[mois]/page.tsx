import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import { PrintButton } from "@/components/salon/PrintButton";
import { fmtCents, fmtIban, kindLabel, categories } from "@/lib/banking-labels";
import { ensureAccount, type TxRow } from "@/lib/server/banking";
import { all, get } from "@/lib/server/db";
import { requireMember } from "@/lib/server/member-auth";

export const metadata = { title: "Relevé" };

export default async function RelevePage({ params }: { params: Promise<{ mois: string }> }) {
  const m = await requireMember();
  const { mois } = await params;
  if (!/^\d{4}-\d{2}$/.test(mois)) notFound();
  const acc = ensureAccount(m.id);
  const rows = all<TxRow>(
    "SELECT * FROM transactions WHERE member_id = ? AND status = 'ok' AND substr(created_at, 1, 7) = ? ORDER BY created_at, id",
    m.id,
    mois,
  );
  const opening =
    get<{ b: number }>(
      "SELECT balance_after_cents b FROM transactions WHERE member_id = ? AND status = 'ok' AND substr(created_at, 1, 7) < ? ORDER BY created_at DESC, id DESC LIMIT 1",
      m.id,
      mois,
    )?.b ?? 0;
  const credits = rows.filter((r) => r.amount_cents > 0).reduce((n, r) => n + r.amount_cents, 0);
  const debits = rows.filter((r) => r.amount_cents < 0).reduce((n, r) => n + r.amount_cents, 0);
  const closing = opening + credits + debits;
  const title = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(`${mois}-15`));
  const d = (iso: string) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(new Date(iso));

  return (
    <div>
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href="/espace/documents" className="text-sm text-[var(--s-muted)] hover:text-white">
          ← Documents
        </Link>
        <PrintButton />
      </div>
      <article className="mx-auto max-w-4xl rounded-2xl bg-white p-8 text-ink md:p-10 print:rounded-none print:p-0">
        <div className="flex items-start justify-between">
          <Logo />
          <div className="text-right">
            <div className="font-display text-xl font-semibold capitalize">Relevé · {title}</div>
            <div className="text-xs text-muted">
              {m.prenom} {m.nom} · {m.member_number}
            </div>
            <div className="font-mono text-xs text-muted">{fmtIban(acc.iban)}</div>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 rounded-xl bg-mist p-5 text-sm md:grid-cols-4">
          {[
            ["Solde initial", opening],
            ["Crédits", credits],
            ["Débits", debits],
            ["Solde final", closing],
          ].map(([k, v]) => (
            <div key={k as string}>
              <div className="text-xs text-muted">{k}</div>
              <div className="mt-1 font-mono font-medium tabular-nums">{fmtCents(v as number)}</div>
            </div>
          ))}
        </div>
        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="py-2 font-normal">Date</th>
              <th className="py-2 font-normal">Libellé</th>
              <th className="py-2 text-right font-normal">Débit</th>
              <th className="py-2 text-right font-normal">Crédit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line/60">
                <td className="py-2 pr-3 font-mono text-xs">{d(r.created_at)}</td>
                <td className="py-2 pr-3">
                  {r.label}
                  <span className="text-xs text-muted"> · {r.kind === "card" ? categories[r.category ?? "autre"]?.label : kindLabel[r.kind]}</span>
                </td>
                <td className="py-2 text-right font-mono tabular-nums">{r.amount_cents < 0 ? fmtCents(-r.amount_cents) : ""}</td>
                <td className="py-2 text-right font-mono tabular-nums">{r.amount_cents > 0 ? fmtCents(r.amount_cents) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="py-8 text-center text-sm text-muted">Aucune opération ce mois-ci.</p>}
        <p className="mt-10 text-[11px] text-muted">Environnement de démonstration : opérations simulées, sans valeur contractuelle.</p>
      </article>
    </div>
  );
}
