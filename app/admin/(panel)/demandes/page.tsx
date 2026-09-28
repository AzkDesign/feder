import Link from "next/link";
import { Badge, Card, Empty, PageHeader, Pagination, btn, inputCls } from "@/components/admin/ui";
import { appStatus, fmtAge, fmtDate, offerLabel, type AppStatus, type Offer } from "@/lib/labels";
import { listApplications } from "@/lib/server/admin-data";
import { requireAdmin } from "@/lib/server/auth";

export const metadata = { title: "Demandes" };

type SP = { status?: string; offer?: string; q?: string; assigned?: string; sort?: string; page?: string };

const tabs: { key: string; label: string }[] = [
  { key: "ouvertes", label: "À traiter" },
  { key: "nouvelle", label: "Nouvelles" },
  { key: "en_etude", label: "En étude" },
  { key: "complement", label: "Complément" },
  { key: "validee", label: "Validées" },
  { key: "refusee", label: "Refusées" },
  { key: "", label: "Toutes" },
];

export default async function DemandesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const status = sp.status ?? "ouvertes";
  const f = { ...sp, status, page: Number(sp.page) || 1 };
  const { rows, total, page, pages, counts } = listApplications(f, admin.id);
  const openCount = (counts.nouvelle ?? 0) + (counts.en_etude ?? 0) + (counts.complement ?? 0);
  const all = Object.values(counts).reduce((a, b) => a + b, 0);
  const count = (k: string) => (k === "ouvertes" ? openCount : k === "" ? all : counts[k] ?? 0);

  const qs = (over: Partial<SP>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, status, page: undefined, ...over }).filter(([, v]) => v !== undefined) as [string, string][]);
    return `?${p}`;
  };
  const exportQs = new URLSearchParams(Object.entries({ status, offer: sp.offer, q: sp.q, assigned: sp.assigned }).filter(([, v]) => v) as [string, string][]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demandes d'admission"
        subtitle={`${total} dossier${total > 1 ? "s" : ""}`}
        actions={
          <a href={`/admin/export/demandes?${exportQs}`} className={btn.ghost}>
            Exporter CSV
          </a>
        }
      />

      <div className="-mx-1 flex gap-1 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={qs({ status: t.key })}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm transition-colors ${
              status === t.key ? "bg-ink text-white" : "text-muted hover:bg-white hover:text-ink"
            }`}
          >
            {t.label}
            <span className={`rounded-md px-1.5 text-xs tabular-nums ${status === t.key ? "bg-white/15" : "bg-ink/[0.06]"}`}>{count(t.key)}</span>
          </Link>
        ))}
      </div>

      <Card pad={false}>
        <form className="flex flex-wrap gap-2 border-b border-line p-4" role="search">
          <input type="hidden" name="status" value={status} />
          <input name="q" defaultValue={sp.q} placeholder="Référence, nom, e-mail, ville…" className={`${inputCls} min-w-[220px] flex-1`} />
          <select name="offer" defaultValue={sp.offer ?? ""} className={`${inputCls} w-auto`}>
            <option value="">Toutes les offres</option>
            {Object.entries(offerLabel).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select name="assigned" defaultValue={sp.assigned ?? ""} className={`${inputCls} w-auto`}>
            <option value="">Toute l'équipe</option>
            <option value="moi">Assignées à moi</option>
            <option value="personne">Non assignées</option>
          </select>
          <select name="sort" defaultValue={sp.sort ?? "recent"} className={`${inputCls} w-auto`}>
            <option value="recent">Plus récentes</option>
            <option value="ancien">Plus anciennes</option>
            <option value="maj">Dernière mise à jour</option>
            <option value="nom">Nom</option>
          </select>
          <button className={btn.primary}>Filtrer</button>
          {(sp.q || sp.offer || sp.assigned) && (
            <Link href={`?status=${status}`} className={btn.ghost}>
              Réinitialiser
            </Link>
          )}
        </form>

        {rows.length === 0 ? (
          <Empty>Aucune demande ne correspond à ces critères.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-[0.08em] text-muted">
                  <th className="px-5 py-3 font-medium">Candidat</th>
                  <th className="px-3 py-3 font-medium">Référence</th>
                  <th className="px-3 py-3 font-medium">Offre</th>
                  <th className="px-3 py-3 font-medium">Statut</th>
                  <th className="px-3 py-3 font-medium">Assigné à</th>
                  <th className="px-3 py-3 font-medium">Reçue</th>
                  <th className="px-5 py-3 text-right font-medium">Ancienneté</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((a) => {
                  const st = appStatus[a.status as AppStatus];
                  return (
                    <tr key={a.id} className="group relative hover:bg-mist/60">
                      <td className="px-5 py-3">
                        <Link href={`/admin/demandes/${a.id}`} className="font-medium after:absolute after:inset-0">
                          {a.prenom} {a.nom}
                        </Link>
                        <div className="text-xs text-muted">
                          {a.email} · {a.ville}
                        </div>
                      </td>
                      <td className="px-3 py-3 font-mono text-xs">{a.reference}</td>
                      <td className="px-3 py-3">{offerLabel[a.offer as Offer]}</td>
                      <td className="px-3 py-3">
                        <Badge tone={st.tone}>{st.label}</Badge>
                      </td>
                      <td className="px-3 py-3 text-muted">{a.assignee ?? "—"}</td>
                      <td className="px-3 py-3 text-muted">{fmtDate(a.created_at)}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-muted">
                        {["validee", "refusee"].includes(a.status) ? "—" : fmtAge(a.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pages={pages} base="/admin/demandes" params={{ ...sp, status }} />
      </Card>
    </div>
  );
}
