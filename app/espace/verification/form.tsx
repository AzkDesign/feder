"use client";

import { useActionState } from "react";
import { memberLogout, memberVerify } from "../actions";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { CodeInput } from "@/components/salon/CodeInput";

export function VerifyForm() {
  const [state, action, pending] = useActionState(memberVerify, undefined);
  return (
    <div>
      <form action={action} className="space-y-5">
        <CodeInput allowRecovery />
        {state?.error && (
          <p role="alert" className="step-in rounded-xl bg-[#3a1512] px-4 py-3 text-sm text-[#ffb4a8]">
            {state.error}
          </p>
        )}
        <MagneticButton type="submit" size="lg" className="w-full" strength={0.15} disabled={pending}>
          {pending ? "Vérification…" : "Entrer dans le Salon"}
        </MagneticButton>
      </form>
      <form action={memberLogout} className="mt-6 text-center">
        <button className="text-sm text-[var(--s-muted)] hover:text-white">Annuler</button>
      </form>
    </div>
  );
}
