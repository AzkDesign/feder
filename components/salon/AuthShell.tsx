import Link from "next/link";
import type { ReactNode } from "react";
import { FederCard } from "@/components/FederCard";
import { Logo } from "@/components/Logo";

export function AuthShell({ title, subtitle, children }: { title: ReactNode; subtitle?: ReactNode; children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col px-6 py-8 md:px-12">
        <Link href="/" aria-label="Retour au site Feder">
          <Logo light />
        </Link>
        <div className="flex flex-1 items-center">
          <div className="step-in mx-auto w-full max-w-sm py-12">
            <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-gold-light/80">Le Salon</div>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-2 text-[var(--s-muted)]">{subtitle}</p>}
            <div className="mt-8">{children}</div>
          </div>
        </div>
        <p className="text-xs text-[var(--s-muted)]">Connexion chiffrée · Double authentification · Session limitée à 30 minutes d'inactivité</p>
      </div>
      <div className="relative hidden items-center justify-center overflow-hidden border-l border-[var(--s-line)] lg:flex">
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(circle at 50% 40%, rgba(212,175,55,0.22), transparent 55%)" }}
          aria-hidden="true"
        />
        <div className="relative w-[440px]">
          <FederCard variant="noire" interactive float holder="MEMBRE FEDER" last4="0001" />
          <p className="mt-14 text-center font-display text-2xl font-medium tracking-tight text-white/85">
            Bienvenue dans <span className="text-gold-grad">votre salon.</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/** Six separate digit boxes backed by one real input (paste & autofill friendly). */
export function CodeHint() {
  return <p className="mt-2 text-xs text-[var(--s-muted)]">Code à 6 chiffres de votre application d'authentification, ou un code de secours.</p>;
}
