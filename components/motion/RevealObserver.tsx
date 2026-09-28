"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * One observer for the whole page: any element with `data-reveal`
 * fades + slides in the first time it enters the viewport.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const reduce = prefersReducedMotion();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );

    const scan = () => {
      document.querySelectorAll("[data-reveal]:not(.is-in)").forEach((el) => {
        if (reduce) el.classList.add("is-in");
        else io.observe(el);
      });
    };

    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
