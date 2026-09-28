"use client";

import { useActionState, useState } from "react";
import { cardSettings, createVirtualCard, declareOpposition } from "../../actions";
import { CodeInput } from "@/components/salon/CodeInput";
import { ErrorNote, OkNote } from "@/components/salon/ui";
import { submitKeeping } from "@/components/salon/useSubmit";

function Toggle({ name, label, hint, defaultChecked }: { name: string; label: string; hint: string; defaultChecked: boolean }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
      <span>
        <span className="block text-[0.95rem]">{label}</span>
        <span className="block text-xs text-[var(--s-muted)]">{hint}</span>
      </span>
      <input type="checkbox" name={name} value="1" defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="s-switch" aria-hidden="true" />
    </label>
  );
}

function Slider({ name, label, value, max, step }: { name: string; label: string; value: number; max: number; step: number }) {
  const [v, setV] = useState(value);
  const fmt = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  return (
    <label className="block py-3">
      <span className="flex justify-between text-[0.95rem]">
        {label}
        <span className="font-mono tabular-nums text-gold-light">{fmt.format(v)}</span>
      </span>
      <input
        type="range"
        name={name}
        min={step}
        max={max}
        step={step}
        value={v}
        onChange={(e) => setV(Number(e.target.value))}
        className="mt-3 w-full accent-[#c9a233]"
      />
      <span className="flex justify-between text-[11px] text-[var(--s-muted)]">
        <span>{fmt.format(step)}</span>
        <span>{fmt.format(max)}</span>
      </span>
    </label>
  );
}

export function CardSettingsForm(p: {
  online: boolean; contactless: boolean; abroad: boolean; limitPayment: number; limitWithdrawal: number; maxPayment: number; maxWithdrawal: number;
}) {
  const [state, action, pending] = useActionState(cardSettings, undefined);
  return (
    <form onSubmit={submitKeeping(action)}>
      <div className="divide-y divide-[var(--s-line)]">
        <Toggle name="online" label="Paiements en ligne" hint="Achats sur internet et applications" defaultChecked={p.online} />
        <Toggle name="contactless" label="Sans contact" hint="Paiements en approchant la carte" defaultChecked={p.contactless} />
        <Toggle name="abroad" label="Paiements à l'étranger" hint="Hors zone euro" defaultChecked={p.abroad} />
        <Slider name="limit_payment" label="Plafond de paiement mensuel" value={p.limitPayment} max={p.maxPayment} step={100} />
        <Slider name="limit_withdrawal" label="Plafond de retrait mensuel" value={p.limitWithdrawal} max={p.maxWithdrawal} step={50} />
      </div>
      <div className="mt-4 flex items-center gap-4">
        <button disabled={pending} className="btn btn-gold btn-md">
          <span>{pending ? "…" : "Enregistrer"}</span>
        </button>
        {state?.ok && <span className="step-in text-sm text-gold-light">✓ {state.ok}</span>}
      </div>
    </form>
  );
}

export function VirtualCardForm() {
  const [state, action, pending] = useActionState(createVirtualCard, undefined);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input name="label" maxLength={40} className="s-input h-11 min-w-[160px] flex-1" placeholder="Nom (ex. Abonnements)" />
      <label className="flex items-center gap-2 text-sm text-[var(--s-muted)]">
        <input type="checkbox" name="single_use" value="1" className="h-4 w-4 accent-[#c9a233]" /> Usage unique
      </label>
      <button disabled={pending} className="btn btn-light btn-sm h-11">
        <span>Créer</span>
      </button>
      <div className="w-full">
        <ErrorNote>{state?.error}</ErrorNote>
      </div>
    </form>
  );
}

export function OppositionForm({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState(declareOpposition, undefined);
  const [open, setOpen] = useState(false);
  if (state?.ok) return <OkNote>{state.ok}</OkNote>;
  if (disabled) return <p className="text-sm text-[var(--s-muted)]">Une nouvelle carte est déjà en cours de fabrication.</p>;
  if (!open) {
    return (
      <div>
        <p className="text-sm text-[var(--s-muted)]">
          Gelez-la d'abord si vous pensez la retrouver. L'opposition est définitive : une nouvelle carte vous est envoyée.
        </p>
        <button type="button" onClick={() => setOpen(true)} className="mt-4 rounded-full border border-[#ff9b8a]/30 px-4 py-2 text-sm text-[#ffb4a8] hover:bg-[#3a1512]">
          Faire opposition
        </button>
      </div>
    );
  }
  return (
    <form onSubmit={submitKeeping(action)} className="step-in space-y-3">
      <select name="reason" className="s-input">
        <option value="perte">Carte perdue</option>
        <option value="vol">Carte volée</option>
        <option value="fraude">Opération frauduleuse</option>
      </select>
      {state?.data?.needCode ? <CodeInput /> : null}
      <ErrorNote>{state?.error && state.error !== "Code de sécurité requis." ? state.error : undefined}</ErrorNote>
      <div className="flex gap-3">
        <button disabled={pending} className="rounded-full bg-[#a33a2a] px-5 py-2.5 text-sm font-medium text-white">
          {pending ? "…" : "Confirmer l'opposition"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-[var(--s-muted)]">
          Annuler
        </button>
      </div>
    </form>
  );
}
