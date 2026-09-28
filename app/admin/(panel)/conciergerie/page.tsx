import Link from "next/link";
import { Badge, Card, Empty, PageHeader } from "@/components/admin/ui";
import { fmtDate, offerLabel, type Offer } from "@/lib/labels";
import { requireAdmin } from "@/lib/server/auth";
import { all } from "@/lib/server/db";

export const metadata = { title: "Conciergerie" };

export default async function ConciergerieAdmin() {
  await requireAdmin();
  const threads = all<{ member_id: number; prenom: string; nom: string; member_number: string; offer: string; body: string; sender: string; created_at: string; n: number }>(
    `SELECT cm.member_id, m.prenom, m.nom, m.member_number, m.offer, cm.body, cm.sender, cm.created_at,
            (SELECT COUNT(*) FROM concierge_messages x WHERE x.member_id = cm.member_id) n
       FROM concierge_messages cm JOIN members m ON m.id = cm.member_id
      WHERE cm.id IN (SELECT MAX(id) FROM concierge_messages GROUP BY member_id)
      ORDER BY (cm.sender = 'member') DESC, cm.created_at DESC`,
  );
  const waiting = threads.filter((t) => t.sender === "member").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Conciergerie" subtitle={`${waiting} conversation${waiting > 1 ? "s" : ""} en attente de réponse`} />
      <Card pad={false}>
        {threads.length === 0 ? (
          <Empty>Aucune demande de conciergerie pour le moment.</Empty>
        ) : (
          <ul className="divide-y divide-line">
            {threads.map((t) => (
              <li key={t.member_id}>
                <Link href={`/admin/conciergerie/${t.member_id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-mist/60">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-light/60 font-medium text-gold-deep">{t.prenom[0]}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">
                        {t.prenom} {t.nom}
                      </span>
                      <span className="text-xs text-muted">
                        {t.member_number} · {offerLabel[t.offer as Offer]}
                      </span>
                    </div>
                    <p className="truncate text-sm text-muted">
                      {t.sender === "admin" ? "Vous : " : ""}
                      {t.body}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs text-muted">{fmtDate(t.created_at, true)}</div>
                    <div className="mt-1">{t.sender === "member" ? <Badge tone="warning">À répondre</Badge> : <Badge tone="good">Répondu</Badge>}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
