"use client";

import { useActionState, useState } from "react";
import { createVault, vaultMoveAction } from "../../actions";
import { ErrorNote } from "@/components/salon/ui";
import { submitKeeping } from "@/components/salon/useSubmit";
import { vaultIcons } from "@/lib/banking-labels";

export function NewVaultForm() {
  const [state, action, pending] = useActionState(createVault, undefined);
  const [icon, setIcon] = useState("star");
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="name" maxLength={40} className="s-input" placeholder="Nom (ex. Voyage à Tokyo)" required />
        <div className="relative">
          <input name="target" inputMode="decimal" className="s-input pr-10" placeholder="Objectif" required />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--s-muted)]">€</span>
        </div>
      </div>
      <input type="hidden" name="icon" value={icon} />
      <div className="flex flex-wrap items-center gap-2">
        {Object.entries(vaultIcons).map(([k, d]) => (
          <button
            key={k}
            type="button"
            onClick={() => setIcon(k)}
            aria-label={k}
            aria-pressed={icon === k}
            className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
              icon === k ? "border-gold/60 bg-gold/15 text-gold-light" : "border-[var(--s-line)] text-white/60 hover:text-white"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={d} />
            </svg>
          </button>
        ))}
        <button disabled={pending} className="btn btn-gold btn-sm ml-auto">
          <span>{pending ? "…" : "Créer"}</span>
        </button>
      </div>
      <ErrorNote>{state?.error}</ErrorNote>
    </form>
  );
}

export function VaultMoveForm({ vault }: { vault: number }) {
  const [state, action, pending] = useActionState(vaultMoveAction, undefined);
  return (
    <form onSubmit={submitKeeping(action)} className="space-y-2">
      <input type="hidden" name="vault" value={vault} />
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input name="amount" inputMode="decimal" className="s-input h-11 pr-9" placeholder="Montant" required />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--s-muted)]">€</span>
        </div>
        <button name="direction" value="in" disabled={pending} className="btn btn-gold btn-sm h-11">
          <span>Ajouter</span>
        </button>
        <button name="direction" value="out" disabled={pending} className="btn btn-light btn-sm h-11">
          <span>Retirer</span>
        </button>
      </div>
      <ErrorNote>{state?.error}</ErrorNote>
      {state?.ok && <p className="step-in text-xs text-gold-light">✓ {state.ok}</p>}
    </form>
  );
}
