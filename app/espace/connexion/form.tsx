"use client";

import Link from "next/link";
import { useActionState } from "react";
import { memberLogin } from "../actions";
import { MagneticButton } from "@/components/motion/MagneticButton";

export function LoginForm() {
  const [state, action, pending] = useActionState(memberLogin, undefined);
  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm text-[var(--s-muted)]">E-mail ou numéro de membre</span>
        <input name="identifiant" className="s-input" autoComplete="username" placeholder="FD-100001" required />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm text-[var(--s-muted)]">Mot de passe</span>
        <input name="password" type="password" className="s-input" autoComplete="current-password" required />
      </label>
      {state?.error && (
        <p role="alert" className="step-in rounded-xl bg-[#3a1512] px-4 py-3 text-sm text-[#ffb4a8]">
          {state.error}
        </p>
      )}
      <MagneticButton type="submit" size="lg" className="w-full" strength={0.15} disabled={pending}>
        {pending ? "Vérification…" : "Continuer"}
      </MagneticButton>
      <p className="pt-4 text-center text-sm text-[var(--s-muted)]">
        Pas encore activé ?{" "}
        <Link href="/suivi" className="text-gold-light underline decoration-gold/50 underline-offset-4">
          Retrouvez votre lien d'activation
        </Link>
      </p>
    </form>
  );
}
