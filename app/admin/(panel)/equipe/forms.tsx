"use client";

import { useActionState } from "react";
import { createAdminAction, resetAdminPassword, type FormState } from "../../actions";
import { btn, inputCls } from "@/components/admin/ui";

function Secret({ state }: { state: FormState }) {
  if (!state) return null;
  if (state.error) return <p className="rounded-xl bg-[#fbe6e3] px-3 py-2 text-sm text-[#a33a2a]">{state.error}</p>;
  return (
    <div className="rounded-xl bg-[#e3f3e8] p-3 text-sm text-[#1f6b3a]">
      <p>{state.ok}</p>
      {state.secret && (
        <code className="mt-2 block select-all rounded-lg bg-white px-3 py-2 font-mono text-base text-ink ring-1 ring-line">{state.secret}</code>
      )}
      {state.secret && <p className="mt-2 text-xs">La personne devra le changer à sa première connexion.</p>}
    </div>
  );
}

export function CreateAdminForm() {
  const [state, action, pending] = useActionState(createAdminAction, undefined);
  return (
    <form action={action} className="space-y-3 text-sm">
      <label className="block">
        <span className="mb-1 block text-muted">Nom complet</span>
        <input name="name" required className={inputCls} />
      </label>
      <label className="block">
        <span className="mb-1 block text-muted">E-mail professionnel</span>
        <input name="email" type="email" required className={inputCls} />
      </label>
      <label className="block">
        <span className="mb-1 block text-muted">Rôle</span>
        <select name="role" className={inputCls} defaultValue="analyste">
          <option value="analyste">Analyste</option>
          <option value="super_admin">Super admin</option>
        </select>
      </label>
      <button disabled={pending} className={`${btn.primary} w-full`}>
        {pending ? "Création…" : "Créer le compte"}
      </button>
      <Secret state={state} />
    </form>
  );
}

export function ResetPasswordButton({ id }: { id: number }) {
  const [state, action, pending] = useActionState(resetAdminPassword, undefined);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Réinitialiser le mot de passe ? La personne sera déconnectée.")) e.preventDefault();
      }}
      className="inline-block text-left"
    >
      <input type="hidden" name="id" value={id} />
      {state ? (
        <div className="max-w-[260px]">
          <Secret state={state} />
        </div>
      ) : (
        <button disabled={pending} className="text-sm text-gold-deep hover:underline">
          {pending ? "…" : "Réinitialiser le mot de passe"}
        </button>
      )}
    </form>
  );
}
