"use client";

import { useActionState, useEffect, useState } from "react";
import { activationLinkAction } from "@/app/admin/salon-actions";
import { btn } from "./ui";

export function ActivationLinkForm({ memberId, activated }: { memberId: number; activated: boolean }) {
  const [state, action, pending] = useActionState(activationLinkAction, undefined);
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  if (state?.secret) {
    return (
      <div className="rounded-xl bg-[#e3f3e8] p-3 text-sm text-[#1f6b3a]">
        <p>{state.ok}</p>
        <code className="mt-2 block select-all break-all rounded-lg bg-white px-3 py-2 font-mono text-xs text-ink ring-1 ring-line">
          {origin}
          {state.secret}
        </code>
      </div>
    );
  }
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (activated && !confirm("Réinitialiser l'accès ? Le mot de passe et la double authentification du membre seront supprimés.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={memberId} />
      {activated && <input type="hidden" name="reset" value="1" />}
      <button disabled={pending} className={`${activated ? btn.danger : btn.ghost} w-full`}>
        {pending ? "…" : activated ? "Réinitialiser l'accès" : "Générer un lien d'activation"}
      </button>
      {state?.error && <p className="mt-2 text-sm text-[#a33a2a]">{state.error}</p>}
    </form>
  );
}
