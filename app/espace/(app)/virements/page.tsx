import { FederPayForm, BeneficiaryForm, TransferForm } from "./forms";
import { deleteBeneficiary } from "../../actions";
import { Panel, SalonTitle } from "@/components/salon/ui";
import { fmtCents, fmtIban } from "@/lib/banking-labels";
import { ensureAccount } from "@/lib/server/banking";
import { all } from "@/lib/server/db";
import { requireMember } from "@/lib/server/member-auth";

export const metadata = { title: "Virements" };

export default async function VirementsPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const m = await requireMember();
  const { mode } = await searchParams;
  const acc = ensureAccount(m.id);
  const beneficiaries = all<{ id: number; name: string; iban: string }>(
    "SELECT id, name, iban FROM beneficiaries WHERE member_id = ? ORDER BY name",
    m.id,
  );
  const recentPay = all<{ counterparty: string; label: string }>(
    `SELECT counterparty, label FROM transactions WHERE member_id = ? AND kind = 'feder_pay_out'
      GROUP BY counterparty ORDER BY MAX(created_at) DESC LIMIT 5`,
    m.id,
  );

  return (
    <div>
      <SalonTitle eyebrow={`Solde disponible · ${fmtCents(acc.balance_cents)}`} title="Virements" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title={
            <span className="flex items-center gap-2">
              <span className="text-gold-grad font-display text-base font-semibold">Feder Pay</span>
              <span className="text-[var(--s-muted)]">· instantané entre membres</span>
            </span>
          }
          className={mode === "feder" ? "ring-1 ring-gold/40" : ""}
        >
          <FederPayForm recents={recentPay.map((r) => ({ number: r.counterparty, name: r.label }))} />
        </Panel>

        <Panel title="Virement bancaire (IBAN)">
          {beneficiaries.length === 0 ? (
            <p className="mb-5 text-sm text-[var(--s-muted)]">Ajoutez d'abord un bénéficiaire ci-dessous.</p>
          ) : (
            <TransferForm beneficiaries={beneficiaries} />
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title={`Bénéficiaires (${beneficiaries.length})`}>
          {beneficiaries.length > 0 && (
            <ul className="mb-6 divide-y divide-[var(--s-line)]">
              {beneficiaries.map((b) => (
                <li key={b.id} className="flex items-center gap-3 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-sm">{b.name[0]}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{b.name}</div>
                    <div className="truncate font-mono text-xs text-[var(--s-muted)]">{fmtIban(b.iban)}</div>
                  </div>
                  <form action={deleteBeneficiary}>
                    <input type="hidden" name="id" value={b.id} />
                    <button className="text-xs text-[var(--s-muted)] hover:text-[#ff9b8a]">Supprimer</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <BeneficiaryForm />
        </Panel>

        <Panel title="Mes coordonnées">
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
              <dt className="text-[var(--s-muted)]">Numéro Feder Pay</dt>
              <dd className="mt-1 select-all font-mono text-gold-light">{m.member_number}</dd>
            </div>
          </dl>
          <p className="mt-5 text-xs text-[var(--s-muted)]">Communiquez votre numéro de membre à un autre membre Feder pour recevoir de l'argent instantanément.</p>
        </Panel>
      </div>
    </div>
  );
}
