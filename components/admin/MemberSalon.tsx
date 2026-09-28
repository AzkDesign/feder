import { ActivationLinkForm } from "./ActivationLinkForm";
import { Card, btn, inputCls } from "./ui";
import { Submit } from "./client";
import { simulateCard, simulateDeposit } from "@/app/admin/salon-actions";
import { categories, fmtCents, fmtIban, kindLabel } from "@/lib/banking-labels";
import { fmtDate } from "@/lib/labels";
import { ensureAccount, recentTransactions } from "@/lib/server/banking";
import { get } from "@/lib/server/db";

/** Admin view of a member's online space: access status + simulated ledger tools. */
export function MemberSalon({ memberId, status }: { memberId: number; status: string }) {
  const acc = ensureAccount(memberId);
  const info = get<{ activated_at: string | null; last_login_at: string | null; activation_expires_at: string | null }>(
    "SELECT activated_at, last_login_at, activation_expires_at FROM members WHERE id = ?",
    memberId,
  )!;
  const txs = recentTransactions(memberId, 8);
  const canUse = status !== "cloture";

  return (
    <>
      <Card title="Espace client">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Statut</dt>
            <dd className="font-medium">{info.activated_at ? "Activé" : "Non activé"}</dd>
          </div>
          {info.activated_at && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Activé le</dt>
              <dd>{fmtDate(info.activated_at, true)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Dernière connexion</dt>
            <dd>{info.last_login_at ? fmtDate(info.last_login_at, true) : "Jamais"}</dd>
          </div>
          {!info.activated_at && info.activation_expires_at && new Date(info.activation_expires_at) > new Date() && (
            <p className="text-xs text-muted">Un lien d'activation est en cours de validité (jusqu'au {fmtDate(info.activation_expires_at, true)}).</p>
          )}
        </dl>
        {canUse && (
          <div className="mt-4">
            <ActivationLinkForm memberId={memberId} activated={!!info.activated_at} />
          </div>
        )}
        <p className="mt-3 text-xs text-muted">Le candidat validé obtient aussi son lien directement sur la page « Suivre ma demande ».</p>
      </Card>

      <Card title="Compte (simulation)">
        <div className="text-xs text-muted">Solde</div>
        <div className="font-display text-2xl font-semibold tabular-nums">{fmtCents(acc.balance_cents)}</div>
        <div className="mt-1 font-mono text-xs text-muted">{fmtIban(acc.iban)}</div>

        {txs.length > 0 && (
          <ul className="mt-4 divide-y divide-line border-y border-line text-sm">
            {txs.map((t) => (
              <li key={t.id} className="flex justify-between gap-3 py-2">
                <span className="min-w-0 truncate">
                  {t.label}
                  <span className="text-xs text-muted">
                    {" "}
                    · {t.status === "refusee" ? `refusé (${t.note})` : t.kind === "card" ? categories[t.category ?? "autre"]?.label : kindLabel[t.kind]}
                  </span>
                </span>
                <span className={`shrink-0 font-mono tabular-nums ${t.status === "refusee" ? "text-muted line-through" : t.amount_cents > 0 ? "text-[#1f6b3a]" : ""}`}>
                  {fmtCents(t.amount_cents, true)}
                </span>
              </li>
            ))}
          </ul>
        )}

        {canUse && (
          <div className="mt-5 space-y-5">
            <form action={simulateDeposit} className="space-y-2">
              <input type="hidden" name="id" value={memberId} />
              <div className="text-xs font-medium uppercase tracking-[0.1em] text-muted">Créditer le compte</div>
              <div className="flex gap-2">
                <input name="amount" inputMode="decimal" placeholder="Montant €" required className={inputCls} />
                <input name="label" placeholder="Libellé" className={inputCls} />
              </div>
              <Submit className={`${btn.ghost} w-full`}>Simuler un versement</Submit>
            </form>
            <form action={simulateCard} className="space-y-2">
              <input type="hidden" name="id" value={memberId} />
              <div className="text-xs font-medium uppercase tracking-[0.1em] text-muted">Paiement carte</div>
              <div className="flex gap-2">
                <input name="merchant" placeholder="Commerçant" required className={inputCls} />
                <input name="amount" inputMode="decimal" placeholder="€" required className={`${inputCls} w-28`} />
              </div>
              <div className="flex gap-2">
                <select name="category" className={inputCls} aria-label="Catégorie">
                  {Object.entries(categories).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
                <select name="channel" className={inputCls} aria-label="Canal">
                  <option value="store">En magasin</option>
                  <option value="contactless">Sans contact</option>
                  <option value="online">En ligne</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="abroad" value="1" className="accent-[#8c6b12]" /> À l'étranger
              </label>
              <Submit className={`${btn.ghost} w-full`}>Simuler le paiement</Submit>
              <p className="text-xs text-muted">Les règles de la carte s'appliquent : gel, plafonds, réglages du membre, solde.</p>
            </form>
          </div>
        )}
      </Card>
    </>
  );
}
