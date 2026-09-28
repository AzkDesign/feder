"use client";

import { useActionState, useState } from "react";
import { activationPassword, activationTotp } from "../actions";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { CodeInput } from "@/components/salon/CodeInput";

const err = (e?: string) =>
  e ? (
    <p role="alert" className="step-in rounded-xl bg-[#3a1512] px-4 py-3 text-sm text-[#ffb4a8]">
      {e}
    </p>
  ) : null;

export function ActivationFlow({ token, memberNumber }: { token: string; memberNumber: string }) {
  const [pwdState, pwdAction, pwdPending] = useActionState(activationPassword, undefined);
  const [totpState, totpAction, totpPending] = useActionState(activationTotp, undefined);
  const [saved, setSaved] = useState(false);

  const step = totpState?.ok === "done" ? 3 : pwdState?.ok === "password" ? 2 : 1;

  return (
    <div>
      <ol className="mb-8 grid grid-cols-3 gap-2 text-xs">
        {["Mot de passe", "Double authentification", "Codes de secours"].map((l, i) => (
          <li key={l}>
            <div className={`h-1 rounded-full transition-colors duration-500 ${i < step ? "bg-gold" : "bg-white/10"}`} />
            <div className={`mt-2 ${i < step ? "text-white" : "text-[var(--s-muted)]"}`}>{l}</div>
          </li>
        ))}
      </ol>

      {step === 1 && (
        <form action={pwdAction} className="step-in space-y-4">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="username" value={memberNumber} autoComplete="username" />
          <label className="block">
            <span className="mb-2 block text-sm text-[var(--s-muted)]">Choisissez un mot de passe</span>
            <input name="password" type="password" minLength={12} autoComplete="new-password" className="s-input" required />
            <span className="mt-1.5 block text-xs text-[var(--s-muted)]">12 caractères minimum, avec minuscule, majuscule et chiffre.</span>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-[var(--s-muted)]">Confirmez-le</span>
            <input name="confirm" type="password" autoComplete="new-password" className="s-input" required />
          </label>
          {err(pwdState?.error)}
          <MagneticButton type="submit" size="lg" className="w-full" strength={0.15} disabled={pwdPending}>
            {pwdPending ? "…" : "Continuer"}
          </MagneticButton>
        </form>
      )}

      {step === 2 && (
        <form action={totpAction} className="step-in space-y-5">
          <input type="hidden" name="token" value={token} />
          <p className="text-sm leading-relaxed text-[var(--s-muted)]">
            Scannez ce code avec Google Authenticator, Authy, 1Password ou l'application de votre choix, puis saisissez le code affiché.
          </p>
          <div className="flex items-center gap-5">
            <div
              className="h-40 w-40 shrink-0 overflow-hidden rounded-2xl bg-white p-2"
              dangerouslySetInnerHTML={{ __html: String(pwdState?.data?.qr ?? "") }}
            />
            <div className="min-w-0 text-xs text-[var(--s-muted)]">
              Impossible de scanner ? Saisissez cette clé :
              <code className="mt-2 block select-all break-all rounded-lg bg-white/5 p-2 font-mono text-[11px] text-white">{String(pwdState?.data?.secret)}</code>
            </div>
          </div>
          <CodeInput autoFocus={false} />
          {err(totpState?.error)}
          <MagneticButton type="submit" size="lg" className="w-full" strength={0.15} disabled={totpPending}>
            {totpPending ? "…" : "Vérifier"}
          </MagneticButton>
        </form>
      )}

      {step === 3 && (
        <div className="step-in space-y-5">
          <p className="text-sm leading-relaxed text-[var(--s-muted)]">
            Conservez ces codes de secours en lieu sûr. Chacun permet une connexion si vous perdez votre téléphone. Ils ne seront plus
            affichés.
          </p>
          <ul className="grid grid-cols-2 gap-2 rounded-2xl bg-white/5 p-4 font-mono text-sm">
            {(totpState?.data?.codes as string[]).map((c) => (
              <li key={c} className="select-all text-center tracking-wider">
                {c}
              </li>
            ))}
          </ul>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-[#c9a233]" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
            J'ai enregistré mes codes de secours
          </label>
          <MagneticButton href={saved ? "/espace/connexion" : undefined} size="lg" className="w-full" strength={0.15} disabled={!saved}>
            Me connecter au Salon
          </MagneticButton>
        </div>
      )}
    </div>
  );
}
