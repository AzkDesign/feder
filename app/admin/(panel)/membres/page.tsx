import Link from "next/link";
import { Badge, Card, Empty, PageHeader, Pagination, btn, inputCls } from "@/components/admin/ui";
import { cardStatus, fmtDate, memberStatus, offerLabel, type CardStatus, type MemberStatus, type Offer } from "@/lib/labels";
import { listMembers } from "@/lib/server/admin-data";
import { requireAdmin } from "@/lib/server/auth";

export const metadata = { title: "Membres" };

type SP = { status?: string; offer?: string; card?: string; q?: string; page?: string };

export default async function MembresPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const { rows, total, page, pages, counts } = listMembers({ ...sp, page: Number(sp.page) || 1 });
  const exportQs = new URLSearchParams(Object.entries({ status: sp.status, offer: sp.offer, card: sp.card, q: sp.q }).filter(([, v]) => v) as [string, string][]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Membres"
        subtitle={`${counts.actif ?? 0} actifs · ${counts.suspendu ?? 0} suspendus · ${counts.cloture ?? 0} clôturés`}
        actions={
          <a href={`/admin/export/membres?${exportQs}`} className={btn.ghost}>
            Exporter CSV
          </a>
        }
      />

      <Card pad={false}>
        <form className="flex flex-wrap gap-2 border-b border-line p-4" role="search">
          <input name="q" defaultValue={sp.q} placeholder="N° membre, nom, e-mail…" className={`${inputCls} min-w-[220px] flex-1`} />
          <select name="status" defaultValue={sp.status ?? ""} className={`${inputCls} w-auto`}>
            <option value="">Tous les statuts</option>
            {Object.entries(memberStatus).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          <select name="offer" defaultValue={sp.offer ?? ""} className={`${inputCls} w-auto`}>
            <option value="">Toutes les offres</option>
            {Object.entries(offerLabel).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select name="card" defaultValue={sp.card ?? ""} className={`${inputCls} w-auto`}>
            <option value="">Toutes les cartes</option>
            {Object.entries(cardStatus).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          <button className={btn.primary}>Filtrer</button>
          {(sp.q || sp.status || sp.offer || sp.card) && (
            <Link href="/admin/membres" className={btn.ghost}>
              Réinitialiser
            </Link>
          )}
        </form>

        {rows.length === 0 ? (
          <Empty>{total === 0 && !sp.q ? "Aucun membre pour le moment. Les membres sont créés à la validation d'une demande." : "Aucun membre ne correspond."}</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-[0.08em] text-muted">
                  <th className="px-5 py-3 font-medium">Membre</th>
                  <th className="px-3 py-3 font-medium">N°</th>
                  <th className="px-3 py-3 font-medium">Offre</th>
                  <th className="px-3 py-3 font-medium">Compte</th>
                  <th className="px-3 py-3 font-medium">Carte</th>
                  <th className="px-5 py-3 font-medium">Membre depuis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((m) => {
                  const ms = memberStatus[m.status as MemberStatus];
                  const cs = cardStatus[m.card_status as CardStatus];
                  return (
                    <tr key={m.id} className="relative hover:bg-mist/60">
                      <td className="px-5 py-3">
                        <Link href={`/admin/membres/${m.id}`} className="font-medium after:absolute after:inset-0">
                          {m.prenom} {m.nom}
                        </Link>
                        <div className="text-xs text-muted">{m.email}</div>
                      </td>
                      <td className="px-3 py-3 font-mono text-xs">{m.member_number}</td>
                      <td className="px-3 py-3">{offerLabel[m.offer as Offer]}</td>
                      <td className="px-3 py-3">
                        <Badge tone={ms.tone}>{ms.label}</Badge>
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone={cs.tone}>{cs.label}</Badge>
                      </td>
                      <td className="px-5 py-3 text-muted">{fmtDate(m.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pages={pages} base="/admin/membres" params={sp} />
      </Card>
    </div>
  );
}
