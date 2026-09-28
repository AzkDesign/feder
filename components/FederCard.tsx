"use client";

import { useEffect, useRef } from "react";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";

export type CardVariant = "gold" | "platine" | "noire";

const tierLabel: Record<CardVariant, string> = {
  gold: "OR",
  platine: "PLATINE",
  noire: "NOIRE",
};

type Props = {
  variant?: CardVariant;
  interactive?: boolean;
  float?: boolean;
  holder?: string;
  last4?: string;
  className?: string;
};

/**
 * Metal card: brushed texture, periodic sheen, and — when interactive —
 * a pointer-driven 3D tilt with a moving glare (transform-only, lerped in rAF).
 */
export function FederCard({
  variant = "gold",
  interactive = false,
  float = false,
  holder = "VOTRE NOM",
  last4 = "4821",
  className = "",
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const card = cardRef.current;
    if (!interactive || !wrap || !card || prefersReducedMotion() || !hasFinePointer()) return;

    let rx = 0,
      ry = 0,
      trx = 0,
      tr_y = 0,
      gx = 0,
      gy = 0,
      tgx = 0,
      tgy = 0,
      raf = 0;

    const tick = () => {
      rx += (trx - rx) * 0.1;
      ry += (tr_y - ry) * 0.1;
      gx += (tgx - gx) * 0.1;
      gy += (tgy - gy) * 0.1;
      card.style.transform = `rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)`;
      if (glareRef.current) glareRef.current.style.transform = `translate3d(${gx.toFixed(2)}%, ${gy.toFixed(2)}%, 0)`;
      const moving = Math.abs(trx - rx) + Math.abs(tr_y - ry) + Math.abs(tgx - gx) + Math.abs(tgy - gy) > 0.02;
      raf = moving ? requestAnimationFrame(tick) : 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      trx = -ny * 14;
      tr_y = nx * 18;
      tgx = nx * 40;
      tgy = ny * 40;
      start();
    };
    const onLeave = () => {
      trx = tr_y = tgx = tgy = 0;
      start();
    };

    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);
    return () => {
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [interactive]);

  return (
    <div ref={wrapRef} className={`fcard-wrap ${className}`} style={{ perspective: "1200px" }}>
      <div className={float ? "float-y" : undefined}>
        <div
          ref={cardRef}
          className={`fcard fcard--${variant}`}
          role="img"
          aria-label={`Carte Feder ${tierLabel[variant].toLowerCase()}`}
        >
          <div className="fcard-sheen" />
          <div ref={glareRef} className="fcard-glare" />

          <div className="absolute inset-0 flex flex-col justify-between p-[7cqw]">
            <div className="flex items-start justify-between">
              <span className="t-brand font-display font-semibold">FEDER</span>
              <span className="t-tier font-mono opacity-80">{tierLabel[variant]}</span>
            </div>

            <div className="flex items-center gap-[4cqw]">
              <div className="fcard-chip" />
              <svg viewBox="0 0 24 24" className="h-[7cqw] w-[7cqw] opacity-70" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M8.5 7.5a6 6 0 0 1 0 9M12 5a9.5 9.5 0 0 1 0 14M15.5 2.5a13 13 0 0 1 0 19" strokeLinecap="round" />
              </svg>
            </div>

            <div className="flex items-end justify-between">
              <div className="space-y-[1.5cqw]">
                <div className="t-num font-mono">•••• {last4}</div>
                <div className="t-small font-mono opacity-80">{holder}</div>
              </div>
              <span className="t-small font-mono opacity-70">MEMBRE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
