"use client";

import { useState, type FormEvent } from "react";
import { IconCheck, IconClock, IconDoc } from "./Icons";
import { MagneticButton } from "./motion/MagneticButton";
import { actionLabel, appStatus, fmtDate, offerLabel, toneDot, type AppStatus, type Offer } from "@/lib/labels";

type Result = {
  reference: string;
  status: AppStatus;
  offer: Offer;
  prenom: string;
  message: string | null;
  createdAt: string;
  updatedAt: string;
  timeline: { action: string; detail: string | null; actor_type: string; created_at: string }[];
  activation: { url?: string; activated: boolean } | null;
};

const flow: AppStatus[] = ["nouvelle", "en_etude", "validee"];

const field =
  "h-13 w-full rounded-2xl border border-line bg-white px-4 outline-none transition-[border-color,box-shadow] duration-300 focus:border-gold focus:shadow-[0_0_0_4px_rgba(212,175,55,0.15)]";

export function TrackingClient() {
  const [ref, setRef] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [res, setRes] = useState<Result | null>(null);

  const lookup = async (e?: FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/suivi", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reference: ref, email }),
      });
      const j = await r.json();
      if (!r.ok) {
        setRes(null);
        setError(j.error);
      } else setRes(j);
    } catch {
      setError("Connexion impossible.");
    } finally {
      setLoading(false);
    }
  };

  if (!res) {
    return (
      <form onSubmit={lookup} className="space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm text-ink/80">Référence du dossier</span>
          <input className={`${field} font-mono uppercase`} placeholder="FDR-XXXXXXXX" value={ref} onChange={(e) => setRef(e.target.value)} required />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-ink/80">E-mail utilisé lors de la demande</span>
          <input className={field} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        {error && (
          <p className="rounded-2xl bg-[#fbe6e3] p-4 text-sm text-[#a33a2a]" role="alert">
            {error}
          </p>
        )}
        <MagneticButton type="submit" size="lg" className="w-full" strength={0.15} disabled={loading}>
          {loading ? "Recherche…" : "Consulter mon dossier"}
        </MagneticButton>
      </form>
    );
  }

  const st = appStatus[res.status];
  const stepIndex = res.status === "refusee" ? -1 : res.status === "complement" ? 1 : flow.indexOf(res.status);

  return (
    <div className="step-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-mono text-sm text-gold-deep">{res.reference}</div>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">Bonjour {res.prenom}.</h2>
          <p className="mt-1 text-muted">
            Demande {offerLabel[res.offer]} · déposée le {fmtDate(res.createdAt)}
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium">
          <span className={`h-2 w-2 rounded-full ${toneDot[st.tone]}`} /> {st.public}
        </span>
      </div>

      {res.status !== "refusee" && (
        <ol className="mt-8 grid grid-cols-3 gap-2">
          {["Dossier reçu", "Examen", "Décision"].map((l, i) => (
            <li key={l}>
              <div className={`h-1 rounded-full ${i <= stepIndex ? "bg-gradient-to-r from-gold-deep to-gold" : "bg-line"}`} />
              <div className={`mt-2 text-xs ${i <= stepIndex ? "text-ink" : "text-muted"}`}>{l}</div>
            </li>
          ))}
        </ol>
      )}

      {res.message && (
        <div className="mt-8 rounded-2xl border border-gold/40 bg-gold-light/25 p-5">
          <div className="text-xs uppercase tracking-[0.16em] text-gold-deep">Message de l'équipe Feder</div>
          <p className="mt-2 whitespace-pre-line leading-relaxed">{res.message}</p>
        </div>
      )}

      {res.activation && (
        <div className="mt-6 overflow-hidden rounded-2xl bg-ink p-6 text-white">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold-light">Le Salon · Espace membre</div>
          {res.activation.activated ? (
            <>
              <p className="mt-2 text-white/75">Votre espace membre est activé.</p>
              <a href="/espace/connexion" className="btn btn-gold btn-md mt-5">
                <span>Me connecter</span>
              </a>
            </>
          ) : (
            <>
              <p className="mt-2 leading-relaxed text-white/75">
                Créez votre mot de passe et sécurisez votre accès pour découvrir votre compte, votre carte et vos privilèges. Ce lien est
                personnel et valable 72 heures.
              </p>
              <a href={res.activation.url} className="btn btn-gold btn-md mt-5">
                <span>Activer mon espace</span>
              </a>
            </>
          )}
        </div>
      )}

      {res.status === "complement" && <ComplementForm reference={res.reference} email={email} onDone={() => lookup()} />}

      <div className="mt-10">
        <h3 className="text-sm font-medium text-muted">Historique</h3>
        <ul className="mt-4 space-y-4 border-l border-line pl-5">
          {res.timeline.map((t, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-gold" />
              <div className="text-sm font-medium">{actionLabel[t.action] ?? t.action}</div>
              {t.detail && <p className="mt-0.5 whitespace-pre-line text-sm text-muted">{t.detail}</p>}
              <div className="mt-0.5 text-xs text-muted">{fmtDate(t.created_at, true)}</div>
            </li>
          ))}
        </ul>
      </div>

      <button type="button" onClick={() => setRes(null)} className="mt-10 text-sm text-muted hover:text-ink">
        ← Consulter un autre dossier
      </button>
    </div>
  );
}

function ComplementForm({ reference, email, onDone }: { reference: string; email: string; onDone: () => void }) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("reference", reference);
    fd.append("email", email);
    fd.append("message", message);
    files.forEach((f) => fd.append("files", f));
    setSending(true);
    setError(null);
    const r = await fetch("/api/suivi/complement", { method: "POST", body: fd }).catch(() => null);
    setSending(false);
    if (!r) return setError("Connexion impossible.");
    const j = await r.json();
    if (!r.ok) return setError(j.error);
    onDone();
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-line p-5">
      <div className="font-medium">Répondre à l'équipe Feder</div>
      <textarea
        className="min-h-28 w-full rounded-2xl border border-line p-4 outline-none focus:border-gold"
        placeholder="Votre message (facultatif)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={2000}
      />
      <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-[#d8d2c4] p-4 hover:border-gold">
        <input
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          className="sr-only"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 5))}
        />
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mist text-gold-deep">
          {files.length ? <IconCheck className="h-5 w-5" /> : <IconDoc className="h-5 w-5" />}
        </span>
        <span className="text-sm">
          {files.length ? files.map((f) => f.name).join(", ") : "Joindre des documents (PDF, JPG, PNG · 5 max · 10 Mo)"}
        </span>
      </label>
      {error && <p className="text-sm text-[#a33a2a]">{error}</p>}
      <MagneticButton type="submit" strength={0.15} disabled={sending}>
        {sending ? "Envoi…" : "Envoyer ma réponse"}
      </MagneticButton>
      <p className="flex items-center gap-2 text-xs text-muted">
        <IconClock className="h-3.5 w-3.5" /> Votre dossier repassera automatiquement en examen.
      </p>
    </form>
  );
}
