"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addBeneficiary, federPayAction, lookupRecipient, transferAction } from "../../actions";
import { CodeInput } from "@/components/salon/CodeInput";
import { ErrorNote, OkNote } from "@/components/salon/ui";
import { submitKeeping } from "@/components/salon/useSubmit";
import { fmtCents, fmtIban } from "@/lib/banking-labels";

function Success({ amount, to, onAgain }: { amount: number; to: string; onAgain: () => void }) {
  return (
    <div className="step-in py-6 text-center">
      <svg viewBox="0 0 52 52" className="mx-auto h-16 w-16" aria-hidden="true">
        <circle cx="26" cy="26" r="24" fill="none" stroke="rgba(212,175,55,0.35)" strokeWidth="2" />
        <path className="check-draw" d="M15 27l7 7 15-15" fill="none" stroke="#e8cd7a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="mt-4 font-display text-3xl font-semibold">{fmtCents(amount)}</div>
      <p className="mt-1 text-sm text-[var(--s-muted)]">envoyés à {to}</p>
      <button type="button" onClick={onAgain} className="mt-6 text-sm text-gold-light hover:underline">
        Nouvel envoi
      </button>
    </div>
  );
}

export function FederPayForm({ recents }: { recents: { number: string; name: string }[] }) {
  const [state, action, pending] = useActionState(federPayAction, undefined);
  const [numero, setNumero] = useState("");
  const [recipient, setRecipient] = useState<{ name: string; number: string } | null | undefined>(undefined);
  const [key, setKey] = useState(0);
  const [dismissed, setDismissed] = useState<typeof state>(undefined);
  const timer = useRef<number>(0);

  useEffect(() => {
    window.clearTimeout(timer.current);
    const n = numero.trim().toUpperCase();
    if (!/^FD-\d{6}$/.test(n)) {
      setRecipient(undefined);
      return;
    }
    timer.current = window.setTimeout(async () => setRecipient(await lookupRecipient(n)), 250);
  }, [numero]);

  // A success screen is shown once per send; "Nouvel envoi" dismisses that exact result.
  if (state?.ok === "sent" && state !== dismissed && recipient) {
    return (
      <Success
        amount={Number(state.data?.amount)}
        to={recipient.name}
        onAgain={() => {
          setDismissed(state);
          setNumero("");
          setKey((k) => k + 1);
        }}
      />
    );
  }

  return (
    <form key={key} onSubmit={submitKeeping(action)} className="space-y-4">
      {recents.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {recents.map((r) => (
            <button
              key={r.number}
              type="button"
              onClick={() => setNumero(r.number)}
              className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--s-line)] py-1 pl-1 pr-3 text-xs hover:border-gold/40"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/15 text-gold-light">{r.name[0]}</span>
              {r.name.split(" ")[0]}
            </button>
          ))}
        </div>
      )}
      <label className="block">
        <span className="mb-2 block text-sm text-[var(--s-muted)]">Numéro de membre du destinataire</span>
        <input name="numero" value={numero} onChange={(e) => setNumero(e.target.value)} className="s-input font-mono uppercase" placeholder="FD-100000" required />
        <span className="mt-1.5 block h-5 text-sm">
          {recipient === null && <span className="text-[#ff9b8a]">Aucun membre actif avec ce numéro.</span>}
          {recipient && <span className="step-in inline-block text-gold-light">✓ {recipient.name}</span>}
        </span>
      </label>
      <label className="block">
        <span className="mb-2 block text-sm text-[var(--s-muted)]">Montant</span>
        <div className="relative">
          <input name="amount" inputMode="decimal" className="s-input pr-10 font-display text-xl" placeholder="0,00" required />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--s-muted)]">€</span>
        </div>
      </label>
      <label className="block">
        <span className="mb-2 block text-sm text-[var(--s-muted)]">Message (facultatif)</span>
        <input name="note" maxLength={140} className="s-input" placeholder="Dîner de samedi 🍷" />
      </label>
      {state?.data?.needCode && (
        <div className="step-in space-y-2">
          <span className="block text-sm text-[var(--s-muted)]">Au-delà de 500 €, confirmez avec votre code</span>
          <CodeInput />
        </div>
      )}
      <ErrorNote>{state?.error && state.error !== "Code de sécurité requis." ? state.error : undefined}</ErrorNote>
      <button disabled={pending || !recipient} className="btn btn-gold btn-lg w-full disabled:opacity-40">
        <span>{pending ? "Envoi…" : "Envoyer instantanément"}</span>
      </button>
    </form>
  );
}

export function TransferForm({ beneficiaries }: { beneficiaries: { id: number; name: string; iban: string }[] }) {
  const [state, action, pending] = useActionState(transferAction, undefined);
  const [key, setKey] = useState(0);
  const [sel, setSel] = useState(beneficiaries[0]?.id);
  const [dismissed, setDismissed] = useState<typeof state>(undefined);
  const b = beneficiaries.find((x) => x.id === sel);

  if (state?.ok === "sent" && state !== dismissed && b) {
    return (
      <Success
        amount={Number(state.data?.amount)}
        to={b.name}
        onAgain={() => {
          setDismissed(state);
          setKey((k) => k + 1);
        }}
      />
    );
  }

  return (
    <form key={key} onSubmit={submitKeeping(action)} className="space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm text-[var(--s-muted)]">Bénéficiaire</span>
        <select name="beneficiary" className="s-input" value={sel} onChange={(e) => setSel(Number(e.target.value))}>
          {beneficiaries.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>
        {b && <span className="mt-1.5 block font-mono text-xs text-[var(--s-muted)]">{fmtIban(b.iban)}</span>}
      </label>
      <label className="block">
        <span className="mb-2 block text-sm text-[var(--s-muted)]">Montant</span>
        <div className="relative">
          <input name="amount" inputMode="decimal" className="s-input pr-10 font-display text-xl" placeholder="0,00" required />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--s-muted)]">€</span>
        </div>
      </label>
      <label className="block">
        <span className="mb-2 block text-sm text-[var(--s-muted)]">Libellé (facultatif)</span>
        <input name="label" maxLength={140} className="s-input" />
      </label>
      {state?.data?.needCode && (
        <div className="step-in space-y-2">
          <span className="block text-sm text-[var(--s-muted)]">Confirmez ce virement avec votre code</span>
          <CodeInput />
        </div>
      )}
      <ErrorNote>{state?.error && state.error !== "Code de sécurité requis." ? state.error : undefined}</ErrorNote>
      <button disabled={pending} className="btn btn-gold btn-lg w-full">
        <span>{pending ? "Envoi…" : "Valider le virement"}</span>
      </button>
      <p className="text-xs text-[var(--s-muted)]">Virement instantané SEPA, exécuté immédiatement.</p>
    </form>
  );
}

export function BeneficiaryForm() {
  const [state, action, pending] = useActionState(addBeneficiary, undefined);
  const [key, setKey] = useState(0);
  useEffect(() => {
    if (state?.ok) setKey((k) => k + 1);
  }, [state]);
  return (
    <form key={key} onSubmit={submitKeeping(action)} className="space-y-3">
      <div className="text-sm font-medium">Ajouter un bénéficiaire</div>
      <input name="name" className="s-input" placeholder="Nom du titulaire" required />
      <input name="iban" className="s-input font-mono uppercase" placeholder="FR76 …" required />
      {state?.data?.needCode && (
        <div className="step-in space-y-2">
          <span className="block text-sm text-[var(--s-muted)]">Confirmez avec votre code</span>
          <CodeInput />
        </div>
      )}
      <ErrorNote>{state?.error && state.error !== "Code de sécurité requis." ? state.error : undefined}</ErrorNote>
      <OkNote>{state?.ok}</OkNote>
      <button disabled={pending} className="btn btn-light btn-md w-full">
        <span>{pending ? "…" : "Ajouter"}</span>
      </button>
    </form>
  );
}
