"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { easeOutExpo, prefersReducedMotion } from "@/lib/motion";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

type Props = {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
};

/**
 * Rolls from 0 to `value` the first time it scrolls into view.
 * Writes textContent directly (no React re-render per frame).
 * Server HTML holds the final value, so no-JS and reduced-motion users see it as-is.
 */
export function CountUp({ value, decimals = 0, prefix = "", suffix = "", duration = 1800, className = "" }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const fmt = useMemo(
    () => new Intl.NumberFormat("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
    [decimals],
  );
  const render = (n: number) => `${prefix}${fmt.format(n)}${suffix}`;

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    el.textContent = render(0);
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const frame = (now: number) => {
          const p = Math.min(1, (now - t0) / duration);
          el.textContent = render(value * easeOutExpo(p));
          if (p < 1) raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      el.textContent = render(value);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, fmt, prefix, suffix]);

  return (
    <>
      <span ref={ref} aria-hidden="true" className={`tabular-nums ${className}`}>
        {render(value)}
      </span>
      <span className="sr-only">{render(value)}</span>
    </>
  );
}
