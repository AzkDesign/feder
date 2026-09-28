import { deleteVirtualCard } from "../../actions";
import { CardSettingsForm, OppositionForm, VirtualCardForm } from "./forms";
import { CardStage } from "@/components/salon/CardStage";
import { Panel, SalonTitle } from "@/components/salon/ui";
import { fmtCents, offerRules } from "@/lib/banking-labels";
import { monthCashbackPreview } from "@/lib/server/banking";
import { all, get } from "@/lib/server/db";
import { requireMember } from "@/lib/server/member-auth";

export const metadata = { title: "Ma carte" };

export default async function CartePage() {
  const m = await requireMember();
  const s = get<{
    card_online: number; card_contactless: number; card_abroad: number; limit_payment_cents: number | null; limit_withdrawal_cents: number | null;
  }>("SELECT card_online, card_contactless, card_abroad, limit_payment_cents, limit_withdrawal_cents FROM members WHERE id = ?", m.id)!;
  const rules = offerRules[m.offer];
  const limitPay = s.limit_payment_cents ?? rules.maxPayment;
  const { spent } = monthCashbackPreview(m.id, m.offer);
  const virtual = all<{ id: number; label: string; last4: string; single_use: number; created_at: string }>(
    "SELECT id, label, last4, single_use, created_at FROM virtual_cards WHERE member_id = ? AND status = 'active' ORDER BY created_at DESC",
    m.id,
  );
  const tier = m.offer === "gold" ? "Feder Or" : m.offer === "platine" ? "Feder Platine" : "Feder Noire";

  return (
    <div>
      <SalonTitle eyebrow={tier} title="Ma carte" />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <Panel>
            <CardStage variant={m.offer} holder={`${m.prenom[0]}. ${m.nom}`.toUpperCase()} last4={m.card_last4} cardStatus={m.card_status} />
          </Panel>
          <Panel title="Plafond de paiement ce mois-ci">
            <div className="flex items-end justify-between">
              <div className="font-display text-2xl font-semibold tabular-nums">{fmtCents(spent)}</div>
              <div className="text-sm text-[var(--s-muted)]">sur {fmtCents(limitPay)}</div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/[0.06]">
              <div className="h-2 rounded-full bg-gradient-to-r from-[#8c6b12] to-[#e8cd7a]" style={{ width: `${Math.min(100, (spent / limitPay) * 100)}%` }} />
            </div>
          </Panel>
          <Panel title="Carte perdue ou volée ?">
            <OppositionForm disabled={m.card_status === "en_fabrication" || m.card_status === "opposee"} />
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Contrôles">
            <CardSettingsForm
              online={!!s.card_online}
              contactless={!!s.card_contactless}
              abroad={!!s.card_abroad}
              limitPayment={limitPay / 100}
              limitWithdrawal={(s.limit_withdrawal_cents ?? rules.maxWithdrawal) / 100}
              maxPayment={rules.maxPayment / 100}
              maxWithdrawal={rules.maxWithdrawal / 100}
            />
          </Panel>

          <Panel title="Cartes virtuelles">
            <p className="mb-4 text-sm text-[var(--s-muted)]">
              Pour vos achats en ligne : une carte dédiée par site, ou à usage unique qui s'autodétruit après le premier paiement.
            </p>
            {virtual.length > 0 && (
              <ul className="mb-5 grid gap-3 sm:grid-cols-2">
                {virtual.map((v) => (
                  <li key={v.id} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2a2a30] to-[#141417] p-4 ring-1 ring-white/10">
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-medium">{v.label}</span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] tracking-wider text-white/70">
                        {v.single_use ? "USAGE UNIQUE" : "VIRTUELLE"}
                      </span>
                    </div>
                    <div className="mt-6 font-mono text-sm tracking-widest">•••• {v.last4}</div>
                    <form action={deleteVirtualCard} className="mt-3">
                      <input type="hidden" name="id" value={v.id} />
                      <button className="text-xs text-[var(--s-muted)] hover:text-[#ff9b8a]">Supprimer</button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
            <VirtualCardForm />
          </Panel>
        </div>
      </div>
    </div>
  );
}
