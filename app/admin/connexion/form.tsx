"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";
import { btn, inputCls } from "@/components/admin/ui";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="mt-7 space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm">E-mail</span>
        <input name="email" type="email" autoComplete="username" required className={`${inputCls} h-11`} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm">Mot de passe</span>
        <input name="password" type="password" autoComplete="current-password" required className={`${inputCls} h-11`} />
      </label>
      {state?.error && (
        <p role="alert" className="rounded-xl bg-[#fbe6e3] px-3 py-2 text-sm text-[#a33a2a]">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={`${btn.primary} h-11 w-full`}>
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
