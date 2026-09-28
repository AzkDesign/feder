import Link from "next/link";
import { Card, Empty, PageHeader, Pagination, btn, inputCls } from "@/components/admin/ui";
import { actionLabel, fmtDate } from "@/lib/labels";
import { listAdmins, listEvents } from "@/lib/server/admin-data";
import { requireAdmin } from "@/lib/server/auth";

export const metadata = { title: "Journal d'audit" };

const types: Record<string, string> = {
  application: "Demandes",
  member: "Membres",
  admin: "Équipe",
  auth: "Connexions",
  settings: "Paramètres",
};

export default async function JournalPage({ searchParams }: { searchParams: Promise<{ type?: string; admin?: string; page?: string }> }) {
  await requireAdmin("super_admin");
  const sp = await searchParams;
  const { rows, total, page, pages } = listEvents({ ...sp, page: Number(sp.page) || 1 });
  const admins = listAdmins();

  return (
    <div className="space-y-6">
      <PageHeader title="Journal d'audit" subtitle={`${total} événements · conservés sans modification possible`} />
      <Card pad={false}>
        <form className="flex flex-wrap gap-2 border-b border-line p-4">
          <select name="type" defaultValue={sp.type ?? ""} className={`${inputCls} w-auto`}>
            <option value="">Tous les types</option>
            {Object.entries(types).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select name="admin" defaultValue={sp.admin ?? ""} className={`${inputCls} w-auto`}>
            <option value="">Tous les auteurs</option>
            {admins.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <button className={btn.primary}>Filtrer</button>
        </form>
        {rows.length === 0 ? (
          <Empty>Aucun événement.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-[0.08em] text-muted">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Auteur</th>
                  <th className="px-3 py-3 font-medium">Action</th>
                  <th className="px-3 py-3 font-medium">Objet</th>
                  <th className="px-3 py-3 font-medium">Détail</th>
                  <th className="px-5 py-3 font-medium">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((e) => (
                  <tr key={e.id} className="align-top">
                    <td className="whitespace-nowrap px-5 py-3 text-muted">{fmtDate(e.created_at, true)}</td>
                    <td className="px-3 py-3">{e.actor_type === "admin" ? e.admin_name ?? "Admin supprimé" : e.actor_type === "candidat" ? "Candidat" : "Système"}</td>
                    <td className="px-3 py-3 font-medium">{actionLabel[e.action] ?? e.action}</td>
                    <td className="px-3 py-3">
                      {e.entity_id && (e.entity_type === "application" || e.entity_type === "member") ? (
                        <Link
                          href={e.entity_type === "member" ? `/admin/membres/${e.entity_id}` : `/admin/demandes/${e.entity_id}`}
                          className="text-gold-deep hover:underline"
                        >
                          {types[e.entity_type]} #{e.entity_id}
                        </Link>
                      ) : (
                        <span className="text-muted">{types[e.entity_type] ?? e.entity_type}</span>
                      )}
                    </td>
                    <td className="max-w-[320px] px-3 py-3 text-muted">
                      <span className="line-clamp-2 break-words">{e.detail ?? "—"}</span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted">{e.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pages={pages} base="/admin/journal" params={sp} />
      </Card>
    </div>
  );
}
