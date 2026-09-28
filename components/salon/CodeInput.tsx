"use client";

import { useRef, useState } from "react";

/**
 * One-time code field: six visual boxes over a single real input, so paste,
 * SMS/app autofill and screen readers all work normally.
 */
export function CodeInput({ name = "code", autoFocus = true, allowRecovery = false }: { name?: string; autoFocus?: boolean; allowRecovery?: boolean }) {
  const [value, setValue] = useState("");
  const [recovery, setRecovery] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  if (recovery) {
    return (
      <div>
        <input name={name} className="s-input text-center font-mono uppercase tracking-[0.3em]" placeholder="XXXX-XXXX" autoFocus required />
        <button type="button" onClick={() => setRecovery(false)} className="mt-2 text-xs text-[var(--s-muted)] hover:text-white">
          Utiliser mon application
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="relative" onClick={() => ref.current?.focus()}>
        <input
          ref={ref}
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          autoFocus={autoFocus}
          required
          aria-label="Code de sécurité à 6 chiffres"
          className="peer absolute inset-0 h-full w-full cursor-text opacity-0"
        />
        <div className="grid grid-cols-6 gap-2" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => {
            const active = i === Math.min(value.length, 5);
            return (
              <div
                key={i}
                className={`flex h-14 items-center justify-center rounded-xl border font-mono text-2xl transition-[border-color,box-shadow] duration-200 ${
                  active ? "peer-focus:border-gold border-[var(--s-line)]" : "border-[var(--s-line)]"
                } bg-[var(--s-surface-2)] ${value[i] ? "text-white" : "text-white/20"}`}
                style={active ? { boxShadow: "0 0 0 1px rgba(212,175,55,0.5)" } : undefined}
              >
                {value[i] ?? "·"}
              </div>
            );
          })}
        </div>
      </div>
      {allowRecovery && (
        <button type="button" onClick={() => setRecovery(true)} className="mt-3 text-xs text-[var(--s-muted)] hover:text-white">
          J'ai perdu l'accès à mon application → code de secours
        </button>
      )}
    </div>
  );
}
