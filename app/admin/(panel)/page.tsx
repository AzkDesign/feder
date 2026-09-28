import Link from "next/link";
import { DailyBars } from "@/components/admin/client";
import { Badge, Card, Empty, Flash, PageHeader, Stat, Timeline } from "@/components/admin/ui";
import { appStatus, fmtAge, fmtEur, offerLabel, type AppStatus, type Offer } from "@/lib/labels";
import { dashboard } from "@/lib/server/admin-data";
import { requireAdmin } from "@/lib/server/auth";

export const metadata = { title: "Tableau de bord" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const admin = await requireAdmin();
  const { erreur } = await searchParams;
  const d = dashboard(admin.id);
  const offerTotal = d.offers.reduce((n, o) => n + o.n, 0);
  const hour = new Date().getHours();

  return (
    <div className="space-y-8">
      <PageHeader
        title={`${hour < 18 ? "Bonjour" : "Bonsoir"} ${admin.name.split(" ")[0]}`}
        subtitle={d.mine > 0 ? `${d.mine} dossier${d.mine > 1 ? "s" : ""} vous ${d.mine > 1 ? "sont assignés" : "est assigné"}.` : "Voici l'activité de Feder."}
        actions={
          <Link href="/admin/demandes?status=ouvertes" className="inline-flex h-10 items-center rounded-xl bg-ink px-4 text-sm font-medium text-white hover:bg-ink-2">
            Traiter les demandes
          </Link>
        }
      />
      <Flash erreur={erreur === "acces" ? "Cette section est réservée aux super admins." : undefined} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Demandes en attente"
          value={d.pending}
          hint={d.overdue > 0 ? `${d.overdue} au-delà de ${d.slaHours} h` : `Aucune au-delà de ${d.slaHours} h`}
          tone={d.overdue > 0 ? "critical" : undefined}
        />
        <Stat label="Reçues aujourd'hui" value={d.today} hint={`${d.byStatus.complement ?? 0} en attente de complément`} />
        <Stat
          label="Taux d'acceptation · 30 j"
          value={d.acceptance === null ? "—" : `${d.acceptance} %`}
          hint={`${d.validated30} validées · ${d.refused30} refusées${d.avgDecisionHours !== null ? ` · décision en ${d.avgDecisionHours} h en moy.` : ""}`}
        />
        <Stat label="Membres actifs" value={d.activeMembers} hint={`${fmtEur(d.mrr)} de cotisations / mois`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card title="Demandes reçues · 30 derniers jours">
          <DailyBars data={d.perDay} />
        </Card>
        <Card title="Offres demandées · 30 jours">
          {offerTotal === 0 ? (
            <Empty>Aucune demande sur la période.</Empty>
          ) : (
            <ul className="space-y-4">
              {(["gold", "platine", "noire"] as Offer[]).map((o) => {
                const n = d.offers.find((x) => x.offer === o)?.n ?? 0;
                const pct = Math.round((n / offerTotal) * 100);
                return (
                  <li key={o}>
                    <div className="flex justify-between text-sm">
                      <span>{offerLabel[o]}</span>
                      <span className="tabular-nums text-muted">
                        {n} · {pct} %
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-mist">
                      <div className="h-2 rounded-full bg-[#c9a233]" style={{ width: `${Math.max(pct, n ? 2 : 0)}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-6 grid grid-cols-3 gap-2 border-t border-line pt-5 text-center">
            {(["gold", "platine", "noire"] as Offer[]).map((o) => (
              <div key={o}>
                <div className="font-display text-xl font-semibold tabular-nums">{d.memberCount[o] ?? 0}</div>
                <div className="text-xs text-muted">membres {offerLabel[o].replace("Feder ", "")}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card
          title="File d'attente"
          pad={false}
          action={
            <Link href="/admin/demandes?status=ouvertes" className="text-sm text-gold-deep hover:underline">
              Tout voir
            </Link>
          }
        >
          {d.queue.length === 0 ? (
            <Empty>Aucune demande en attente. Tout est à jour.</Empty>
          ) : (
            <ul className="divide-y divide-line">
              {d.queue.map((a) => {
                const late = Date.now() - new Date(a.created_at).getTime() > d.slaHours * 3600_000 && a.status !== "complement";
                return (
                  <li key={a.id}>
                    <Link href={`/admin/demandes/${a.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-mist/60">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {a.prenom} {a.nom}
                        </div>
                        <div className="text-xs text-muted">
                          {a.reference} · {offerLabel[a.offer as Offer]} · {a.assignee ?? "Non assigné"}
                        </div>
                      </div>
                      <span className={`text-xs tabular-nums ${late ? "font-medium text-[#a33a2a]" : "text-muted"}`}>{fmtAge(a.created_at)}</span>
                      <Badge tone={appStatus[a.status as AppStatus].tone}>{appStatus[a.status as AppStatus].label}</Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card title="Activité récente">
          <Timeline events={d.activity} showEntity />
        </Card>
      </div>
    </div>
  );
}
