import Link from "next/link";
import { notFound } from "next/navigation";
import { addNote, reissueCard, updateCardStatus, updateMemberContact, updateMemberOffer, updateMemberStatus } from "../../../actions";
import { ActionPanel, Submit } from "@/components/admin/client";
import { MemberSalon } from "@/components/admin/MemberSalon";
import { Badge, Card, Flash, Timeline, btn, inputCls, textareaCls } from "@/components/admin/ui";
import { FederCard, type CardVariant } from "@/components/FederCard";
import { cardStatus, fmtDate, memberStatus, offerLabel, type CardStatus, type MemberStatus, type Offer } from "@/lib/labels";
import { getMember } from "@/lib/server/admin-data";
import { requireAdmin } from "@/lib/server/auth";

export const metadata = { title: "Membre" };

export default async function MembreDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;
  const { ok, erreur } = await searchParams;
  const data = getMember(Number(id));
  if (!data) notFound();
  const { member: m, application, notes, events } = data;
  const ms = memberStatus[m.status as MemberStatus];
  const cs = cardStatus[m.card_status as CardStatus];
  const isSuper = admin.role === "super_admin";

  const cardTransitions: CardStatus[] = (() => {
    switch (m.card_status as CardStatus) {
      case "en_fabrication":
        return ["expediee"];
      case "expediee":
        return ["active", "opposee"];
      case "active":
        return ["gelee", "opposee"];
      case "gelee":
        return ["active", "opposee"];
      default:
        return [];
    }
  })();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/membres" className="text-sm text-muted hover:text-ink">
          ← Membres
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
            {m.civilite === "Madame" ? "Mme" : m.civilite === "Monsieur" ? "M." : ""} {m.prenom} {m.nom}
          </h1>
          <Badge tone={ms.tone}>{ms.label}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted">
          <span className="font-mono">{m.member_number}</span> · {offerLabel[m.offer as Offer]} · membre depuis le {fmtDate(m.created_at)}
          {application && (
            <>
              {" · "}
              <Link href={`/admin/demandes/${application.id}`} className="text-gold-deep hover:underline">
                dossier {application.reference}
              </Link>
            </>
          )}
        </p>
      </div>

      <Flash ok={ok} erreur={erreur} />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Carte">
              <FederCard variant={m.offer as CardVariant} holder={`${m.prenom[0]}. ${m.nom}`.toUpperCase()} last4={m.card_last4} className="max-w-[320px]" />
              <div className="mt-5 flex items-center justify-between text-sm">
                <span className="text-muted">Statut</span>
                <Badge tone={cs.tone}>{cs.label}</Badge>
              </div>
              {cardTransitions.length > 0 && (
                <form action={updateCardStatus} className="mt-4 flex gap-2">
                  <input type="hidden" name="id" value={m.id} />
                  <select name="cardStatus" className={inputCls} aria-label="Nouveau statut de carte">
                    {cardTransitions.map((c) => (
                      <option key={c} value={c}>
                        {cardStatus[c].label}
                      </option>
                    ))}
                  </select>
                  <Submit className={btn.primary} confirm="Modifier le statut de la carte ?">
                    Appliquer
                  </Submit>
                </form>
              )}
              {(m.card_status === "opposee" || m.card_status === "gelee") && m.status === "actif" && (
                <form action={reissueCard} className="mt-3">
                  <input type="hidden" name="id" value={m.id} />
                  <Submit className={`${btn.ghost} w-full`} confirm="Commander une nouvelle carte (nouveau numéro) ?">
                    Émettre une nouvelle carte
                  </Submit>
                </form>
              )}
            </Card>

            <Card title="Coordonnées">
              <form action={updateMemberContact} className="space-y-3 text-sm">
                <input type="hidden" name="id" value={m.id} />
                {[
                  ["email", "E-mail", m.email, "email"],
                  ["telephone", "Téléphone", m.telephone, "tel"],
                  ["ville", "Ville", m.ville, "text"],
                  ["pays", "Pays", m.pays, "text"],
                ].map(([name, label, value, type]) => (
                  <label key={name as string} className="block">
                    <span className="mb-1 block text-muted">{label}</span>
                    <input name={name as string} type={type as string} defaultValue={(value as string) ?? ""} className={inputCls} />
                  </label>
                ))}
                <Submit className={`${btn.ghost} w-full`}>Enregistrer</Submit>
              </form>
              {application && (
                <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Profession</dt>
                    <dd className="text-right">{application.profession}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Revenus</dt>
                    <dd className="text-right">{application.revenus}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Patrimoine</dt>
                    <dd className="text-right">{application.patrimoine}</dd>
                  </div>
                </dl>
              )}
            </Card>
          </div>

          <Card title="Historique">
            <Timeline events={events} />
          </Card>
        </div>

        <div className="space-y-6">
          <MemberSalon memberId={m.id} status={m.status} />
          <Card title="Offre">
            <form action={updateMemberOffer} className="flex gap-2">
              <input type="hidden" name="id" value={m.id} />
              <select name="offer" defaultValue={m.offer} className={inputCls} aria-label="Offre">
                {Object.entries(offerLabel).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <Submit className={btn.primary} confirm="Changer l'offre de ce membre ?">
                Changer
              </Submit>
            </form>
          </Card>

          <Card title="Compte">
            <div className="space-y-3">
              {m.status !== "actif" && (m.status !== "cloture" || isSuper) && (
                <form action={updateMemberStatus}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="status" value="actif" />
                  <Submit className={`${btn.gold} w-full`} confirm="Réactiver ce compte ?">
                    Réactiver le compte
                  </Submit>
                </form>
              )}
              {m.status === "actif" && (
                <ActionPanel label="Suspendre le compte" className={btn.ghost}>
                  <form action={updateMemberStatus} className="space-y-3">
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="status" value="suspendu" />
                    <textarea name="reason" rows={3} required className={textareaCls} placeholder="Motif de la suspension" />
                    <p className="text-xs text-muted">La carte sera automatiquement gelée.</p>
                    <Submit className={`${btn.primary} w-full`}>Suspendre</Submit>
                  </form>
                </ActionPanel>
              )}
              {m.status !== "cloture" && isSuper && (
                <ActionPanel label="Clôturer le compte" className={btn.danger}>
                  <form action={updateMemberStatus} className="space-y-3">
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="status" value="cloture" />
                    <textarea name="reason" rows={3} required className={textareaCls} placeholder="Motif de la clôture" />
                    <p className="text-xs text-muted">La carte sera mise en opposition.</p>
                    <Submit className={`${btn.danger} w-full`} confirm="Clôturer définitivement ce compte ?">
                      Clôturer
                    </Submit>
                  </form>
                </ActionPanel>
              )}
            </div>
          </Card>

          <Card title={`Notes internes (${notes.length})`}>
            <form action={addNote} className="space-y-2">
              <input type="hidden" name="entityType" value="member" />
              <input type="hidden" name="entityId" value={m.id} />
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
