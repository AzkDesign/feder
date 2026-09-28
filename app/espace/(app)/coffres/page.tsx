import { closeVaultAction } from "../../actions";
import { NewVaultForm, VaultMoveForm } from "./forms";
import { CountUp } from "@/components/motion/CountUp";
import { Panel, SalonTitle } from "@/components/salon/ui";
import { fmtCents, vaultIcons } from "@/lib/banking-labels";
import { ensureAccount, vaultsOf } from "@/lib/server/banking";
import { requireMember } from "@/lib/server/member-auth";

export const metadata = { title: "Coffres" };

function Ring({ pct }: { pct: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90" aria-hidden="true">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="url(#ring-gold)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.min(1, pct / 100))}
        className="ring-progress"
      />
      <defs>
        <linearGradient id="ring-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8c6b12" />
          <stop offset=".5" stopColor="#f5e6b8" />
          <stop offset="1" stopColor="#c9a233" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default async function CoffresPage() {
  const m = await requireMember();
  const vaults = vaultsOf(m.id);
  const total = vaults.reduce((n, v) => n + v.balance_cents, 0);
  const acc = ensureAccount(m.id);

  return (
    <div>
      <SalonTitle eyebrow="Épargne" title="Mes coffres" />

      <div className="mb-6 grid gap-6 md:grid-cols-[1fr_1.4fr]">
        <Panel>
          <div className="text-sm text-[var(--s-muted)]">Total mis de côté</div>
          <div className="mt-2 font-display text-4xl font-semibold tracking-tight text-gold-grad">
            <CountUp value={total / 100} decimals={2} suffix=" €" />
          </div>
          <div className="mt-2 text-sm text-[var(--s-muted)]">Disponible sur le compte : {fmtCents(acc.balance_cents)}</div>
        </Panel>
        <Panel title="Nouveau coffre">
          <NewVaultForm />
        </Panel>
      </div>

      {vaults.length === 0 ? (
        <p className="py-16 text-center text-[var(--s-muted)]">Aucun coffre pour l'instant. Donnez un nom à votre prochain projet.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {vaults.map((v, i) => {
            const pct = Math.round((v.balance_cents / v.target_cents) * 100);
            return (
              <section key={v.id} data-reveal style={{ "--d": `${i * 80}ms` } as React.CSSProperties} className="s-card p-6">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <Ring pct={pct} />
                    <span className="absolute inset-0 flex items-center justify-center text-gold-light">
                      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d={vaultIcons[v.icon] ?? vaultIcons.star} />
                      </svg>
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-xl font-semibold tracking-tight">{v.name}</h2>
                    <div className="mt-1 font-mono text-sm tabular-nums">{fmtCents(v.balance_cents)}</div>
                    <div className="text-xs text-[var(--s-muted)]">
                      sur {fmtCents(v.target_cents)} · {Math.min(pct, 999)} %{pct >= 100 ? " · objectif atteint ✦" : ""}
                    </div>
                  </div>
                </div>
                <div className="mt-5">
                  <VaultMoveForm vault={v.id} />
                </div>
                <form action={closeVaultAction} className="mt-3 text-right">
                  <input type="hidden" name="vault" value={v.id} />
                  <button className="text-xs text-[var(--s-muted)] hover:text-white">Clôturer (fonds reversés sur le compte)</button>
                </form>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
