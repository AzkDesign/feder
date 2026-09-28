"use client";

import { useActionState, useEffect, useOptimistic, useState, useTransition } from "react";
import { revealCard, toggleFreeze } from "@/app/espace/actions";
import { FederCard, type CardVariant } from "@/components/FederCard";
import { CodeInput } from "./CodeInput";
import { ErrorNote } from "./ui";

const statusText: Record<string, string> = {
  active: "Active",
  gelee: "Gelée",
  en_fabrication: "En fabrication",
  expediee: "En cours de livraison",
  opposee: "En opposition",
};

/**
 * The member's card: 3D tilt, frost overlay when frozen (optimistic), and a flip to the
 * back showing full card details after a 2FA step-up. Details auto-hide after 30 s.
 */
export function CardStage({
  variant,
  holder,
  last4,
  cardStatus,
  compact = false,
}: {
  variant: CardVariant;
  holder: string;
  last4: string;
  cardStatus: string;
  compact?: boolean;
}) {
  const [frozen, setFrozen] = useOptimistic(cardStatus === "gelee");
  const [pending, start] = useTransition();
  const [state, action, revealing] = useActionState(revealCard, undefined);
  const [flipped, setFlipped] = useState(false);
  const [asking, setAsking] = useState(false);
  const [left, setLeft] = useState(0);

  const details = state?.ok === "revealed" ? (state.data as { pan: string; expiry: string; cvv: string }) : null;

  useEffect(() => {
    if (!details) return;
    setAsking(false);
    setFlipped(true);
    setLeft(30);
    const iv = window.setInterval(() => setLeft((s) => s - 1), 1000);
    const t = window.setTimeout(() => setFlipped(false), 30_000);
    return () => {
      window.clearInterval(iv);
      window.clearTimeout(t);
    };
  }, [details]);

  useEffect(() => {
    if (state?.data?.needCode) setAsking(true);
  }, [state]);

  const canToggle = cardStatus === "active" || cardStatus === "gelee";

  return (
    <div>
      <div className="flip" data-flipped={flipped}>
        <div className="flip-inner">
          <div className="flip-face relative" data-frozen={frozen} style={{ containerType: "inline-size" }}>
            <FederCard variant={variant} interactive={!frozen} holder={holder} last4={last4} />
            <div className="frost" aria-hidden="true" />
            {frozen && (
              <span className="step-in absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/85 px-4 py-1.5 text-xs font-semibold tracking-[0.14em] text-[#29405f]">
                CARTE GELÉE
              </span>
            )}
          </div>
          <div className="flip-face flip-back" style={{ containerType: "inline-size" }}>
            <div className="relative h-full overflow-hidden rounded-[5.5cqw] bg-gradient-to-br from-[#1b1b1f] via-[#101012] to-[#1b1b1f] text-white shadow-2xl ring-1 ring-white/10">
              <div className="mt-[9cqw] h-[13cqw] bg-black" />
              <div className="space-y-[3cqw] p-[6cqw] font-mono">
                <div>
                  <div className="text-[2.6cqw] tracking-[0.2em] text-white/45">NUMÉRO</div>
                  <div className="select-all text-[5.4cqw] tracking-[0.08em]">{details?.pan ?? "•••• •••• •••• " + last4}</div>
                </div>
                <div className="flex gap-[10cqw]">
                  <div>
                    <div className="text-[2.6cqw] tracking-[0.2em] text-white/45">EXPIRE</div>
                    <div className="text-[4.4cqw]">{details?.expiry ?? "••/••"}</div>
                  </div>
                  <div>
                    <div className="text-[2.6cqw] tracking-[0.2em] text-white/45">CVV</div>
                    <div className="select-all text-[4.4cqw]">{details?.cvv ?? "•••"}</div>
                  </div>
                  <div className="ml-auto self-end text-[2.8cqw] text-gold-light/80">{left > 0 ? `masqué dans ${left} s` : ""}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`mt-5 flex flex-wrap items-center gap-2 ${compact ? "justify-center" : ""}`}>
        <span className="mr-auto inline-flex items-center gap-2 text-xs text-[var(--s-muted)]">
          <span className={`h-2 w-2 rounded-full ${frozen ? "bg-[#9cc4f5]" : cardStatus === "active" ? "bg-[#6fcf97]" : "bg-gold"}`} />
          {frozen ? "Gelée" : statusText[cardStatus] ?? cardStatus}
        </span>
        {canToggle && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                setFrozen(!frozen);
                await toggleFreeze();
              })
            }
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              frozen ? "border-[#9cc4f5]/40 bg-[#9cc4f5]/10 text-[#cfe2fb]" : "border-[var(--s-line)] text-white/85 hover:border-white/25"
            }`}
          >
            {frozen ? "Dégeler" : "Geler"}
          </button>
        )}
        {cardStatus !== "en_fabrication" && cardStatus !== "opposee" && (
          <button
            type="button"
            onClick={() => (flipped ? setFlipped(false) : details ? setFlipped(true) : setAsking(true))}
            className="rounded-full border border-[var(--s-line)] px-4 py-2 text-sm text-white/85 hover:border-white/25"
          >
            {flipped ? "Masquer" : "Afficher les numéros"}
          </button>
        )}
      </div>

      {asking && !flipped && (
        <form action={action} className="step-in mt-4 space-y-3 rounded-2xl border border-[var(--s-line)] bg-white/[0.03] p-4">
          <p className="text-sm text-[var(--s-muted)]">Confirmez votre identité pour afficher les données de la carte.</p>
          {state?.data?.needCode ? <CodeInput /> : <input type="hidden" name="code" value="" />}
          <ErrorNote>{state?.error && state.error !== "Code de sécurité requis." ? state.error : undefined}</ErrorNote>
          <div className="flex gap-2">
            <button disabled={revealing} className="btn btn-gold btn-sm">
              <span>{revealing ? "…" : state?.data?.needCode ? "Confirmer" : "Continuer"}</span>
            </button>
            <button type="button" onClick={() => setAsking(false)} className="text-sm text-[var(--s-muted)] hover:text-white">
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
