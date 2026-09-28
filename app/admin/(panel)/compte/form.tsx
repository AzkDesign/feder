"use client";

import { useActionState } from "react";
import { changePasswordAction } from "../../actions";
import { btn, inputCls } from "@/components/admin/ui";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, undefined);
  return (
    <form action={action} className="space-y-3 text-sm">
      <label className="block">
        <span className="mb-1 block text-muted">Mot de passe actuel</span>
        <input name="current" type="password" autoComplete="current-password" required className={inputCls} />
      </label>
      <label className="block">
        <span className="mb-1 block text-muted">Nouveau mot de passe</span>
        <input name="next" type="password" autoComplete="new-password" minLength={12} required className={inputCls} />
        <span className="mt-1 block text-xs text-muted">12 caractères minimum, avec minuscule, majuscule et chiffre.</span>
      </label>
      <label className="block">
        <span className="mb-1 block text-muted">Confirmer</span>
        <input name="confirm" type="password" autoComplete="new-password" required className={inputCls} />
      </label>
      {state?.error && <p className="rounded-xl bg-[#fbe6e3] px-3 py-2 text-[#a33a2a]">{state.error}</p>}
      {state?.ok && <p className="rounded-xl bg-[#e3f3e8] px-3 py-2 text-[#1f6b3a]">{state.ok}</p>}
      <button disabled={pending} className={btn.primary}>
        {pending ? "…" : "Mettre à jour"}
      </button>
    </form>
  );
}
