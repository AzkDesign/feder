"use client";

import { useId, useState } from "react";
import { IconPlus } from "@/components/Icons";

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const id = useId();

  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} data-open={isOpen}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-6 py-6 text-left"
              aria-expanded={isOpen}
              aria-controls={`${id}-${i}`}
              onClick={() => setOpen(isOpen ? null : i)}
            >
              <span className="font-display text-lg font-medium tracking-tight md:text-xl">{item.q}</span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line">
                <IconPlus className="acc-icon h-4 w-4 text-gold-deep" />
              </span>
            </button>
            <div id={`${id}-${i}`} className="acc-panel" data-open={isOpen}>
              <div>
                <p className="max-w-3xl pb-7 leading-relaxed text-muted">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
