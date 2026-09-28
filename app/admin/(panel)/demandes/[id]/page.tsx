import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addNote,
  assignApplication,
  refuseApplication,
  reopenApplication,
  requestComplement,
  takeApplication,
  validateApplication,
} from "../../../actions";
import { ActionPanel, Submit } from "@/components/admin/client";
import { Badge, Card, Flash, Timeline, btn, inputCls, textareaCls } from "@/components/admin/ui";
import { FederCard, type CardVariant } from "@/components/FederCard";
import { appStatus, docKindLabel, fmtAge, fmtDate, offerLabel, type AppStatus, type Offer } from "@/lib/labels";
import { getApplication } from "@/lib/server/admin-data";
import { requireAdmin } from "@/lib/server/auth";

export const metadata = { title: "Dossier" };

export default async function DemandeDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;
  const { ok, erreur } = await searchParams;
  const data = getApplication(Number(id));
  if (!data) notFound();
  const { app, documents, notes, events, team, member, duplicates } = data;
  const st = appStatus[app.status as AppStatus];
  const open = ["nouvelle", "en_etude", "complement"].includes(app.status);
  const canDecide = open;
  const assignee = team.find((t) => t.id === app.assigned_to);
  const age = (Date.now() - new Date(String(app.naissance)).getTime()) / (365.25 * 86400_000);

  const info: [string, string | number | null][] = [
    ["Civilité", app.civilite],
    ["Prénom", app.prenom],
    ["Nom", app.nom],
    ["Date de naissance", `${fmtDate(String(app.naissance))} (${Math.floor(age)} ans)`],
    ["Nationalité", app.nationalite],
    ["E-mail", app.email],
    ["Téléphone", app.telephone],
    ["Adresse", `${app.adresse}, ${app.code_postal} ${app.ville}`],
    ["Pays de résidence", app.pays],
  ];
  const situation: [string, string | number | null][] = [
    ["Profession", app.profession],
    ["Revenus annuels", app.revenus],
    ["Patrimoine financier", app.patrimoine],
    ["Origine des fonds", app.origine],
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/demandes" className="text-sm text-muted hover:text-ink">
          ← Demandes
        </Link>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
                {app.prenom} {app.nom}
              </h1>
              <Badge tone={st.tone}>{st.label}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted">
              <span className="font-mono">{app.reference}</span> · {offerLabel[app.offer as Offer]} · reçue le {fmtDate(app.created_at, true)}
              {open && ` · il y a ${fmtAge(app.created_at)}`}
            </p>
          </div>
          {member && (
            <Link href={`/admin/membres/${member.id}`} className={btn.gold}>
              Voir le membre {member.member_number}
            </Link>
          )}
        </div>
      </div>

      <Flash ok={ok} erreur={erreur} />

      {duplicates.length > 0 && (
        <div className="rounded-2xl bg-[#fbf1dc] px-4 py-3 text-sm text-[#8a5a00] ring-1 ring-inset ring-[#8a5a00]/15">
          Cet e-mail apparaît dans {duplicates.length} autre{duplicates.length > 1 ? "s" : ""} dossier{duplicates.length > 1 ? "s" : ""} :{" "}
          {duplicates.map((d, i) => (
            <span key={d.id}>
              {i > 0 && ", "}
              <Link href={`/admin/demandes/${d.id}`} className="font-medium underline">
                {d.reference}
              </Link>{" "}
              ({appStatus[d.status as AppStatus].label.toLowerCase()})
            </span>
          ))}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Identité et coordonnées">
              <dl className="space-y-3 text-sm">
                {info.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[140px_1fr] gap-3">
                    <dt className="text-muted">{k}</dt>
                    <dd className="break-words">{v || "—"}</dd>
                  </div>
                ))}
              </dl>
            </Card>
            <Card title="Situation financière">
              <dl className="space-y-3 text-sm">
                {situation.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[140px_1fr] gap-3">
                    <dt className="text-muted">{k}</dt>
                    <dd>{v || "—"}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 flex items-center gap-4 border-t border-line pt-5">
                <FederCard variant={app.offer as CardVariant} className="w-28" />
                <div className="text-sm">
                  <div className="font-medium">{offerLabel[app.offer as Offer]}</div>
                  <div className="text-muted">Offre demandée</div>
                </div>
              </div>
            </Card>
          </div>

          <Card title={`Justificatifs (${documents.length})`} pad={false}>
            <ul className="divide-y divide-line">
              {documents.map((d) => (
                <li key={d.id} className="flex items-center gap-4 px-5 py-3.5 text-sm">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mist font-mono text-[10px] text-gold-deep">
                    {d.mime === "application/pdf" ? "PDF" : "IMG"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{docKindLabel[d.kind] ?? d.kind}</div>
                    <div className="truncate text-xs text-muted">
                      {d.original_name} · {(d.size / 1024).toFixed(0)} Ko · {d.uploaded_by === "candidat" ? "envoyé par le candidat" : "ajouté par l'équipe"} le{" "}
                      {fmtDate(d.uploaded_at, true)}
                    </div>
                  </div>
                  <a href={`/admin/documents/${d.id}`} target="_blank" rel="noopener" className={btn.ghost}>
                    Ouvrir
                  </a>
                </li>
              ))}
            </ul>
            <p className="border-t border-line px-5 py-3 text-xs text-muted">Documents chiffrés au repos. Chaque consultation est journalisée.</p>
          </Card>

          {app.public_message && (
            <Card title="Dernier message visible par le candidat">
              <p className="whitespace-pre-line text-sm">{app.public_message}</p>
            </Card>
          )}
          {app.decision_reason && (
            <Card title="Motif interne du refus">
              <p className="whitespace-pre-line text-sm">{app.decision_reason}</p>
            </Card>
          )}

          <Card title="Historique complet">
            <Timeline events={events} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Décision">
            {canDecide ? (
              <div className="space-y-3">
                {canDecide && (
                  <ActionPanel label="Valider l'admission" className={btn.gold}>
                    <form action={validateApplication} className="space-y-3">
                      <input type="hidden" name="id" value={app.id} />
                      <label className="block text-sm">
                        <span className="mb-1.5 block text-muted">Message au candidat (facultatif)</span>
                        <textarea name="message" rows={4} className={textareaCls} placeholder="Par défaut : message de bienvenue standard." />
                      </label>
                      <p className="text-xs text-muted">Crée automatiquement la fiche membre et lance la fabrication de la carte.</p>
                      <Submit className={`${btn.gold} w-full`} confirm={`Valider l'admission de ${app.prenom} ${app.nom} ?`}>
                        Confirmer la validation
                      </Submit>
                    </form>
                  </ActionPanel>
                )}
                {canDecide && (
                  <ActionPanel label="Demander un complément" className={btn.ghost}>
                    <form action={requestComplement} className="space-y-3">
                      <input type="hidden" name="id" value={app.id} />
                      <label className="block text-sm">
                        <span className="mb-1.5 block text-muted">Message au candidat</span>
                        <textarea
                          name="message"
                          rows={4}
                          required
                          className={textareaCls}
                          placeholder="Ex. : Merci de nous transmettre votre dernier avis d'imposition complet."
                        />
                      </label>
                      <p className="text-xs text-muted">Le candidat voit ce message sur la page « Suivre ma demande » et peut y répondre.</p>
                      <Submit className={`${btn.primary} w-full`}>Envoyer la demande</Submit>
                    </form>
                  </ActionPanel>
                )}
                <ActionPanel label="Refuser la demande" className={btn.danger}>
                  <form action={refuseApplication} className="space-y-3">
                    <input type="hidden" name="id" value={app.id} />
                    <label className="block text-sm">
                      <span className="mb-1.5 block text-muted">Motif interne (non visible par le candidat)</span>
                      <textarea name="reason" rows={3} required className={textareaCls} />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1.5 block text-muted">Message au candidat (facultatif)</span>
                      <textarea name="message" rows={3} className={textareaCls} placeholder="Par défaut : message de refus courtois standard." />
                    </label>
                    <Submit className={`${btn.danger} w-full`} confirm="Confirmer le refus de cette demande ?">
                      Confirmer le refus
                    </Submit>
                  </form>
                </ActionPanel>
                {app.status === "complement" && (
                  <p className="rounded-xl bg-[#fbf1dc] p-3 text-xs text-[#8a5a00]">
                    En attente du candidat. Le dossier repassera automatiquement « En étude » dès sa réponse.
                  </p>
                )}
              </div>
            ) : app.status === "refusee" && admin.role === "super_admin" ? (
              <form action={reopenApplication} className="space-y-3">
                <input type="hidden" name="id" value={app.id} />
                <p className="text-sm text-muted">Décision rendue le {fmtDate(String(app.decided_at), true)}.</p>
                <Submit className={`${btn.ghost} w-full`} confirm="Rouvrir ce dossier pour réexamen ?">
                  Rouvrir le dossier
                </Submit>
              </form>
            ) : (
              <p className="text-sm text-muted">Décision rendue le {fmtDate(String(app.decided_at), true)}.</p>
            )}
          </Card>

          <Card title="Prise en charge">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Assigné à</span>
                <span className="font-medium">{assignee?.name ?? "Personne"}</span>
              </div>
              {open && app.assigned_to !== admin.id && (
                <form action={takeApplication}>
                  <input type="hidden" name="id" value={app.id} />
                  <Submit className={`${btn.primary} w-full`}>Prendre en charge</Submit>
                </form>
              )}
              {open && (
                <form action={assignApplication} className="flex gap-2">
                  <input type="hidden" name="id" value={app.id} />
                  <select name="adminId" defaultValue={app.assigned_to ?? ""} className={inputCls} aria-label="Assigner à">
                    <option value="">Personne</option>
                    {team.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <Submit className={btn.ghost}>Assigner</Submit>
                </form>
              )}
            </div>
          </Card>

          <Card title={`Notes internes (${notes.length})`}>
            <form action={addNote} className="space-y-2">
              <input type="hidden" name="entityType" value="application" />
              <input type="hidden" name="entityId" value={app.id} />
              <textarea name="body" rows={3} required className={textareaCls} placeholder="Visible uniquement par l'équipe…" />
              <Submit className={`${btn.primary} w-full`}>Ajouter la note</Submit>
            </form>
            {notes.length > 0 && (
              <ul className="mt-5 space-y-4 border-t border-line pt-5">
                {notes.map((n) => (
                  <li key={n.id} className="text-sm">
                    <p className="whitespace-pre-line">{n.body}</p>
                    <div className="mt-1 text-xs text-muted">
                      {n.admin_name ?? "—"} · {fmtDate(n.created_at, true)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
