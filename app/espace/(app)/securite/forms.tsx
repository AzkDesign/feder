"use client";

import { useActionState } from "react";
import { memberChangePassword, regenerateRecoveryCodes } from "../../actions";
import { CodeInput } from "@/components/salon/CodeInput";
import { ErrorNote, OkNote } from "@/components/salon/ui";
import { submitKeeping } from "@/components/salon/useSubmit";

export function PasswordForm() {
  const [state, action, pending] = useActionState(memberChangePassword, undefined);
  return (
    <form action={action} className="space-y-3">
      <input name="current" type="password" autoComplete="current-password" className="s-input" placeholder="Mot de passe actuel" required />
      <input name="next" type="password" autoComplete="new-password" minLength={12} className="s-input" placeholder="Nouveau mot de passe" required />
      <input name="confirm" type="password" autoComplete="new-password" className="s-input" placeholder="Confirmer" required />
      <ErrorNote>{state?.error}</ErrorNote>
      <OkNote>{state?.ok}</OkNote>
      <button disabled={pending} className="btn btn-gold btn-md">
        <span>{pending ? "…" : "Mettre à jour"}</span>
      </button>
    </form>
  );
}

export function RecoveryForm() {
  const [state, action, pending] = useActionState(regenerateRecoveryCodes, undefined);
  const codes = state?.ok === "codes" ? (state.data?.codes as string[]) : null;
  if (codes) {
    return (
      <div className="step-in space-y-3">
        <p className="text-sm text-[var(--s-muted)]">Vos anciens codes ne fonctionnent plus. Conservez ceux-ci en lieu sûr, ils ne seront plus affichés.</p>
        <ul className="grid grid-cols-2 gap-2 rounded-2xl bg-white/5 p-4 font-mono text-sm">
          {codes.map((c) => (
            <li key={c} className="select-all text-center tracking-wider">
              {c}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <form onSubmit={submitKeeping(action)} className="space-y-3">
      <p className="text-sm text-[var(--s-muted)]">Chaque code permet une connexion unique si vous n'avez plus accès à votre application.</p>
      {state?.data?.needCode && <CodeInput />}
      <ErrorNote>{state?.error && state.error !== "Code de sécurité requis." ? state.error : undefined}</ErrorNote>
      <button disabled={pending} className="btn btn-light btn-md">
        <span>{pending ? "…" : "Générer de nouveaux codes"}</span>
      </button>
    </form>
  );
}
