"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";

type Props = {
  children: ReactNode;
  href?: string;
  variant?: "gold" | "dark" | "ghost" | "light";
  size?: "sm" | "md" | "lg";
  strength?: number;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
};

/**
 * Button pulled toward the cursor. The label moves a bit further than the
 * shell for a subtle parallax. Only transforms are written, inside rAF.
 */
export function MagneticButton({
  children,
  href,
  variant = "gold",
  size = "md",
  strength = 0.3,
  className = "",
  type = "button",
  disabled,
  onClick,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !hasFinePointer()) return;

    let x = 0,
      y = 0,
      tx = 0,
      ty = 0,
      raf = 0;

    const tick = () => {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      const settled = Math.abs(tx - x) < 0.05 && Math.abs(ty - y) < 0.05;
      if (settled && tx === 0 && ty === 0) {
        el.style.transform = "";
        if (labelRef.current) labelRef.current.style.transform = "";
        raf = 0;
        return;
      }
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (labelRef.current) labelRef.current.style.transform = `translate3d(${x * 0.4}px, ${y * 0.4}px, 0)`;
      raf = settled ? 0 : requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = (e.clientX - (r.left + r.width / 2)) * strength;
      ty = (e.clientY - (r.top + r.height / 2)) * strength;
      start();
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      start();
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [strength]);

  const cls = `btn btn-${variant} btn-${size} ${disabled ? "pointer-events-none opacity-50" : ""} ${className}`;
  const label = <span ref={labelRef}>{children}</span>;

  if (href) {
    return (
      <Link href={href} ref={ref as React.Ref<HTMLAnchorElement>} className={cls} onClick={onClick}>
        {label}
      </Link>
    );
  }
  return (
    <button ref={ref as React.Ref<HTMLButtonElement>} type={type} className={cls} disabled={disabled} onClick={onClick}>
      {label}
    </button>
  );
}
