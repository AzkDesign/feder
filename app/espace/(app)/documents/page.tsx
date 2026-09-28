import Link from "next/link";
import { Panel, SalonTitle } from "@/components/salon/ui";
import { fmtIban } from "@/lib/banking-labels";
import { ensureAccount } from "@/lib/server/banking";
import { all } from "@/lib/server/db";
import { requireMember } from "@/lib/server/member-auth";

export const metadata = { title: "Documents" };

export default async function DocumentsPage() {
  const m = await requireMember();
  const acc = ensureAccount(m.id);
  const months = all<{ ym: string }>("SELECT DISTINCT substr(created_at, 1, 7) ym FROM transactions WHERE member_id = ? ORDER BY ym DESC", m.id);
  const name = (ym: string) => new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(`${ym}-15`));

  return (
    <div>
      <SalonTitle eyebrow="Compte principal" title="Documents" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Relevé d'identité bancaire" action={<Link href="/espace/documents/rib" className="text-sm text-gold-light hover:underline">Imprimer / PDF</Link>}>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-[var(--s-muted)]">Titulaire</dt>
              <dd className="mt-1">
                {m.prenom} {m.nom}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--s-muted)]">IBAN</dt>
              <dd className="mt-1 select-all font-mono tracking-wide">{fmtIban(acc.iban)}</dd>
            </div>
            <div>
              <dt className="text-[var(--s-muted)]">BIC</dt>
              <dd className="mt-1 font-mono">[À compléter]</dd>
            </div>
          </dl>
        </Panel>
        <Panel title="Relevés mensuels">
          {months.length === 0 ? (
            <p className="text-sm text-[var(--s-muted)]">Votre premier relevé apparaîtra après vos premières opérations.</p>
          ) : (
            <ul className="divide-y divide-[var(--s-line)]">
              {months.map((mo) => (
                <li key={mo.ym}>
                  <Link href={`/espace/documents/releve/${mo.ym}`} className="flex items-center justify-between py-3 text-sm hover:text-gold-light">
                    <span className="capitalize">{name(mo.ym)}</span>
                    <span className="text-xs text-[var(--s-muted)]">Consulter →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
