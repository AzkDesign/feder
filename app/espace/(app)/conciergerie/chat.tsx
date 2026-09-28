"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { sendConciergeMessage } from "../../actions";

type Msg = { id: number; sender: string; body: string; created_at: string };

export function Chat({ initial, prenom, ideas }: { initial: Msg[]; prenom: string; ideas: string[] }) {
  const [messages, setMessages] = useState(initial);
  const [draft, setDraft] = useState("");
  const [state, action, pending] = useActionState(sendConciergeMessage, undefined);
  const end = useRef<HTMLDivElement>(null);
  const lastId = useRef(initial.at(-1)?.id ?? 0);

  // Poll every 5 s (and right after sending) for new messages.
  useEffect(() => {
    let stop = false;
    const tick = async () => {
      const r = await fetch(`/api/espace/messages?after=${lastId.current}`, { cache: "no-store" }).catch(() => null);
      if (!r || !r.ok || stop) return;
      const { messages: fresh } = (await r.json()) as { messages: Msg[] };
      if (fresh.length) {
        lastId.current = fresh[fresh.length - 1].id;
        setMessages((prev) => [...prev, ...fresh.filter((f) => !prev.some((p) => p.id === f.id))]);
      }
    };
    const iv = window.setInterval(tick, 5000);
    if (state?.ok) tick();
    return () => {
      stop = true;
      window.clearInterval(iv);
    };
  }, [state]);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const time = (iso: string) => new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }).format(new Date(iso));

  return (
    <div className="s-card flex h-[calc(100dvh-15rem)] min-h-[480px] flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-[var(--s-line)] px-5 py-4">
        <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#8c6b12] to-[#e8cd7a] font-display font-semibold text-ink">F</span>
        <div>
          <div className="text-sm font-medium">Votre concierge Feder</div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--s-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#6fcf97]" /> Répond en général en quelques minutes
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-6" aria-live="polite">
        <div className="max-w-[80%] rounded-2xl rounded-tl-md bg-white/[0.06] px-4 py-3 text-[0.95rem] leading-relaxed">
          Bonjour {prenom}, je suis à votre disposition. Dites-moi ce que je peux organiser pour vous.
        </div>
        {messages.map((m) => (
          <div key={m.id} className={`step-in flex ${m.sender === "member" ? "justify-end" : ""}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-[0.95rem] leading-relaxed ${
                m.sender === "member" ? "rounded-tr-md bg-gradient-to-br from-[#c9a233] to-[#e8cd7a] text-ink" : "rounded-tl-md bg-white/[0.06]"
              }`}
            >
              <p className="whitespace-pre-line break-words">{m.body}</p>
              <div className={`mt-1 text-[10px] ${m.sender === "member" ? "text-ink/55" : "text-white/40"}`}>{time(m.created_at)}</div>
            </div>
          </div>
        ))}
        <div ref={end} />
      </div>

      {messages.length === 0 && (
        <div className="flex gap-2 overflow-x-auto px-5 pb-3">
          {ideas.map((i) => (
            <button key={i} type="button" onClick={() => setDraft(i)} className="shrink-0 rounded-full border border-[var(--s-line)] px-3 py-1.5 text-xs text-white/75 hover:border-gold/40">
              {i}
            </button>
          ))}
        </div>
      )}

      <form
        action={(fd) => {
          action(fd);
          setDraft("");
        }}
        className="flex items-end gap-2 border-t border-[var(--s-line)] p-3"
      >
        <textarea
          name="body"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder="Écrivez votre demande…"
          className="s-input max-h-40 min-h-12 flex-1 resize-none py-3"
          aria-label="Message"
        />
        <button disabled={pending || !draft.trim()} className="btn btn-gold btn-md h-12 disabled:opacity-40" aria-label="Envoyer">
          <span>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
            </svg>
          </span>
        </button>
      </form>
      {state?.error && <p className="px-5 pb-3 text-xs text-[#ffb4a8]">{state.error}</p>}
    </div>
  );
}
