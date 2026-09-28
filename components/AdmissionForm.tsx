"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { FederCard, type CardVariant } from "./FederCard";
import { IconArrow, IconCheck, IconClock, IconDoc } from "./Icons";
import { MagneticButton } from "./motion/MagneticButton";
import { tiers } from "@/lib/data";

/*
 * Sends the application + documents to /api/admission (stored in the database,
 * documents encrypted at rest). An identity-verification (KYC) provider can be
 * plugged in on the server side before going live.
 */

const steps = ["Identité", "Situation", "Offre", "Justificatifs", "Validation"] as const;

type Data = Record<string, string>;

const required: Record<number, string[]> = {
  0: ["civilite", "prenom", "nom", "naissance", "nationalite", "email", "telephone"],
  1: ["adresse", "codePostal", "ville", "pays", "profession", "revenus", "patrimoine", "origine"],
  2: ["offre"],
  3: ["docIdentite", "docDomicile", "docRevenus"],
  4: ["consentExact", "consentData"],
};

export function AdmissionForm({ initialOffer }: { initialOffer?: string }) {
  const valid = tiers.some((t) => t.id === initialOffer);
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Data>({ pays: "France", offre: valid ? initialOffer! : "platine" });
  const [errors, setErrors] = useState<string[]>([]);
  const [done, setDone] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const files = useRef<Record<string, File>>({});

  const setFile = (k: string, f: File | undefined) => {
    if (f) files.current[k] = f;
    else delete files.current[k];
    set(k, f?.name ?? "");
  };

  const set = (k: string, v: string) => {
    setData((d) => ({ ...d, [k]: v }));
    setErrors((e) => e.filter((x) => x !== k));
  };

  const check = () => {
    const missing = required[step].filter((k) => !data[k]?.trim());
    if (step === 0 && data.email && !/^\S+@\S+\.\S+$/.test(data.email)) missing.push("email");
    setErrors(missing);
    return missing.length === 0;
  };

  const go = (to: number) => {
    setStep(to);
    setErrors([]);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending || !check()) return;
    if (step < steps.length - 1) return go(step + 1);

    const body = new FormData();
    for (const [k, v] of Object.entries(data)) if (!(k in files.current)) body.append(k, v);
    for (const [k, f] of Object.entries(files.current)) body.append(k, f);

    setSending(true);
    setServerError(null);
    try {
      const res = await fetch("/api/admission", { method: "POST", body });
      const json = (await res.json().catch(() => ({}))) as { reference?: string; error?: string };
      if (!res.ok || !json.reference) {
        setServerError(json.error ?? "Une erreur est survenue. Merci de réessayer.");
        return;
      }
      setDone(json.reference);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setServerError("Connexion impossible. Vérifiez votre réseau et réessayez.");
    } finally {
      setSending(false);
    }
  };

  const tier = tiers.find((t) => t.id === data.offre)!;

  if (done) {
    return (
      <div ref={topRef} className="step-in mx-auto max-w-2xl scroll-mt-32 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gold-light to-gold text-ink">
          <IconCheck className="h-8 w-8" />
        </div>
        <h2 className="mt-8 font-display text-4xl font-semibold tracking-tight md:text-5xl">Votre dossier est entre de bonnes mains.</h2>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          Merci {data.prenom}. Votre demande d'admission à <strong className="text-ink">{tier.name}</strong> est en cours d'examen. Vous recevrez
          une réponse à <strong className="text-ink">{data.email}</strong> sous 48 heures ouvrées.
        </p>
        <div className="mx-auto mt-10 inline-flex items-center gap-3 rounded-full border border-line bg-mist px-6 py-3 font-mono text-sm">
          <IconClock className="h-4 w-4 text-gold-deep" /> Référence du dossier : {done}
        </div>
        <p className="mx-auto mt-5 max-w-md text-sm text-muted">
          Conservez cette référence : elle vous permet de{" "}
          <a href="/suivi" className="font-medium text-ink underline decoration-gold underline-offset-4">
            suivre votre demande
          </a>{" "}
          et de répondre à nos éventuelles questions directement sur le site.
        </p>
        <div className="mx-auto mt-12 max-w-sm">
          <FederCard variant={tier.id} interactive float holder={`${data.prenom?.[0] ?? ""}. ${data.nom ?? ""}`.toUpperCase()} />
        </div>
      </div>
    );
  }

  return (
    <div ref={topRef} className="scroll-mt-32">
      {/* Progress */}
      <div className="mb-10">
        <div className="flex justify-between gap-2 text-xs md:text-sm">
          {steps.map((s, i) => (
            <button
              key={s}
              type="button"
              disabled={i > step}
              onClick={() => i < step && go(i)}
              className={`flex items-center gap-2 transition-colors ${i === step ? "text-ink" : i < step ? "text-gold-deep hover:text-ink" : "text-muted/60"}`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border font-mono text-[11px] ${
                  i < step ? "border-gold bg-gold text-ink" : i === step ? "border-ink" : "border-line"
                }`}
              >
                {i < step ? <IconCheck className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{s}</span>
            </button>
          ))}
        </div>
        <div className="mt-5 h-px w-full overflow-hidden bg-line">
          <div
            className="h-full origin-left bg-gradient-to-r from-gold-deep via-gold to-gold-light transition-transform duration-700 ease-out-strong"
            style={{ transform: `scaleX(${(step + 1) / steps.length})` }}
          />
        </div>
      </div>

      <form onSubmit={onSubmit} noValidate>
        <div key={step} className="step-in">
          <h2 className="font-display text-3xl font-semibold tracking-tight">{stepTitle[step]}</h2>
          <p className="mt-2 text-muted">{stepIntro[step]}</p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {step === 0 && (
              <>
                <Field label="Civilité" name="civilite" errors={errors}>
                  <select className={input} value={data.civilite ?? ""} onChange={(e) => set("civilite", e.target.value)}>
                    <option value="">Sélectionner</option>
                    <option>Madame</option>
                    <option>Monsieur</option>
                  </select>
                </Field>
                <div className="hidden sm:block" />
                <Text label="Prénom" name="prenom" data={data} set={set} errors={errors} autoComplete="given-name" />
                <Text label="Nom" name="nom" data={data} set={set} errors={errors} autoComplete="family-name" />
                <Text label="Date de naissance" name="naissance" type="date" data={data} set={set} errors={errors} autoComplete="bday" />
                <Text label="Nationalité" name="nationalite" data={data} set={set} errors={errors} />
                <Text label="E-mail" name="email" type="email" data={data} set={set} errors={errors} autoComplete="email" />
                <Text label="Téléphone" name="telephone" type="tel" data={data} set={set} errors={errors} autoComplete="tel" />
              </>
            )}

            {step === 1 && (
              <>
                <Text label="Adresse" name="adresse" data={data} set={set} errors={errors} autoComplete="street-address" wide />
                <Text label="Code postal" name="codePostal" data={data} set={set} errors={errors} autoComplete="postal-code" />
                <Text label="Ville" name="ville" data={data} set={set} errors={errors} autoComplete="address-level2" />
                <Text label="Pays de résidence" name="pays" data={data} set={set} errors={errors} autoComplete="country-name" />
                <Text label="Profession" name="profession" data={data} set={set} errors={errors} autoComplete="organization-title" />
                <Choice label="Revenus annuels nets" name="revenus" data={data} set={set} errors={errors}
                  options={["Moins de 50 000 €", "50 000 à 100 000 €", "100 000 à 250 000 €", "Plus de 250 000 €"]} />
                <Choice label="Patrimoine financier" name="patrimoine" data={data} set={set} errors={errors}
                  options={["Moins de 100 000 €", "100 000 à 500 000 €", "500 000 € à 1 M€", "Plus de 1 M€"]} />
                <Choice label="Origine principale des fonds" name="origine" data={data} set={set} errors={errors} wide
                  options={["Revenus professionnels", "Épargne", "Héritage ou donation", "Cession d'entreprise ou d'actifs", "Autre"]} />
              </>
            )}

            {step === 2 && (
              <div className="grid gap-4 sm:col-span-2 md:grid-cols-3">
                {tiers.map((t) => {
                  const active = data.offre === t.id;
                  return (
                    <label
                      key={t.id}
                      className={`cursor-pointer rounded-[22px] border p-5 transition-[border-color,box-shadow] duration-300 ${
                        active ? "border-gold shadow-[0_20px_40px_-24px_rgba(140,107,18,0.6)]" : "border-line hover:border-[#d8d2c4]"
                      }`}
                    >
                      <input type="radio" name="offre" value={t.id} checked={active} onChange={() => set("offre", t.id)} className="sr-only" />
                      <FederCard variant={t.id as CardVariant} />
                      <div className="mt-5 flex items-center justify-between">
                        <span className="font-display text-lg font-semibold">{t.name}</span>
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${active ? "border-gold bg-gold" : "border-line"}`}>
                          {active && <IconCheck className="h-3 w-3" />}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-muted">
                        {t.price} {t.period}
                      </div>
                    </label>
                  );
                })}
                {data.offre === "noire" && (
                  <p className="text-sm text-muted md:col-span-3">
                    Feder Noire est attribuée sur invitation. Votre dossier sera étudié pour cette offre, et une offre alternative pourra vous être
                    proposée.
                  </p>
                )}
              </div>
            )}

            {step === 3 && (
              <>
                <FileField label="Pièce d'identité" hint="Passeport ou carte d'identité, recto-verso" name="docIdentite" data={data} onFile={setFile} errors={errors} />
                <FileField label="Justificatif de domicile" hint="De moins de 3 mois" name="docDomicile" data={data} onFile={setFile} errors={errors} />
                <FileField label="Justificatif de revenus" hint="Dernier avis d'imposition ou 3 derniers bulletins" name="docRevenus" data={data} onFile={setFile} errors={errors} wide />
              </>
            )}

            {step === 4 && (
              <div className="space-y-6 sm:col-span-2">
                <dl className="grid gap-px overflow-hidden rounded-[22px] border border-line bg-line sm:grid-cols-2">
                  {[
                    ["Nom", `${data.civilite ?? ""} ${data.prenom ?? ""} ${data.nom ?? ""}`],
                    ["E-mail", data.email],
                    ["Téléphone", data.telephone],
                    ["Ville", `${data.codePostal ?? ""} ${data.ville ?? ""}, ${data.pays ?? ""}`],
                    ["Profession", data.profession],
                    ["Revenus", data.revenus],
                    ["Offre demandée", tier.name],
                    ["Justificatifs", "3 documents joints"],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-white p-5">
                      <dt className="text-xs uppercase tracking-[0.16em] text-muted">{k}</dt>
                      <dd className="mt-1.5 font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
                <Check name="consentExact" data={data} set={set} errors={errors}>
                  Je certifie l'exactitude des informations fournies et l'authenticité des documents transmis.
                </Check>
                <Check name="consentData" data={data} set={set} errors={errors}>
                  J'accepte que mes données soient traitées pour l'étude de ma demande, conformément à la{" "}
                  <a href="/confidentialite" className="underline decoration-gold underline-offset-4">politique de confidentialité</a>.
                </Check>
              </div>
            )}
          </div>

          {errors.length > 0 && (
            <p className="mt-6 text-sm text-[#a33a2a]" role="alert">
              Merci de compléter les champs signalés.
            </p>
          )}
          {serverError && (
            <p className="mt-6 rounded-2xl bg-[#fbe6e3] p-4 text-sm text-[#a33a2a]" role="alert">
              {serverError}
            </p>
          )}

          <div className="mt-10 flex flex-col-reverse gap-3 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
            {step > 0 ? (
              <button type="button" onClick={() => go(step - 1)} className="text-sm text-muted transition-colors hover:text-ink">
                ← Étape précédente
              </button>
            ) : (
              <span className="text-sm text-muted">Environ 5 minutes</span>
            )}
            <MagneticButton type="submit" size="lg" strength={0.2} disabled={sending}>
              {sending ? "Envoi sécurisé…" : step === steps.length - 1 ? "Transmettre mon dossier" : "Continuer"} <IconArrow className="h-4 w-4" />
            </MagneticButton>
          </div>
        </div>
      </form>
    </div>
  );
}

const stepTitle = ["Qui êtes-vous ?", "Votre situation", "Votre offre", "Vos justificatifs", "Vérification"];
const stepIntro = [
  "Ces informations doivent correspondre à votre pièce d'identité.",
  "Elles nous permettent de vous proposer l'offre la plus adaptée.",
  "Vous pourrez évoluer vers une offre supérieure à tout moment.",
  "Formats acceptés : PDF, JPG ou PNG, 10 Mo maximum par fichier.",
  "Relisez votre demande avant de la transmettre.",
];

const input =
  "h-13 w-full rounded-2xl border border-line bg-white px-4 text-[0.97rem] outline-none transition-[border-color,box-shadow] duration-300 placeholder:text-muted/50 focus:border-gold focus:shadow-[0_0_0_4px_rgba(212,175,55,0.15)] aria-[invalid=true]:border-[#c9624f]";

type FieldProps = { name: string; data: Data; set: (k: string, v: string) => void; errors: string[] };

function Field({ label, name, errors, wide, children }: { label: string; name: string; errors: string[]; wide?: boolean; children: ReactNode }) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`} data-invalid={errors.includes(name)}>
      <span className={`mb-2 block text-sm ${errors.includes(name) ? "text-[#a33a2a]" : "text-ink/80"}`}>{label}</span>
      {children}
    </label>
  );
}

function Text({ label, name, type = "text", data, set, errors, autoComplete, wide }: FieldProps & { label: string; type?: string; autoComplete?: string; wide?: boolean }) {
  return (
    <Field label={label} name={name} errors={errors} wide={wide}>
      <input
        className={input}
        type={type}
        name={name}
        autoComplete={autoComplete}
        value={data[name] ?? ""}
        aria-invalid={errors.includes(name)}
        onChange={(e) => set(name, e.target.value)}
      />
    </Field>
  );
}

function Choice({ label, name, options, data, set, errors, wide }: FieldProps & { label: string; options: string[]; wide?: boolean }) {
  return (
    <Field label={label} name={name} errors={errors} wide={wide}>
      <select className={input} value={data[name] ?? ""} aria-invalid={errors.includes(name)} onChange={(e) => set(name, e.target.value)}>
        <option value="">Sélectionner</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </Field>
  );
}

function FileField({
  label,
  hint,
  name,
  data,
  onFile,
  errors,
  wide,
}: Omit<FieldProps, "set"> & { label: string; hint: string; wide?: boolean; onFile: (k: string, f: File | undefined) => void }) {
  const has = !!data[name];
  const bad = errors.includes(name);
  return (
    <label
      className={`flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed p-5 transition-colors ${wide ? "sm:col-span-2" : ""} ${
        has ? "border-gold bg-gold-light/20" : bad ? "border-[#c9624f]" : "border-[#d8d2c4] hover:border-gold"
      }`}
    >
      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(e) => onFile(name, e.target.files?.[0])} />
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${has ? "bg-gold text-ink" : "bg-mist text-gold-deep"}`}>
        {has ? <IconCheck className="h-5 w-5" /> : <IconDoc className="h-5 w-5" />}
      </span>
      <span className="min-w-0">
        <span className="block font-medium">{label}</span>
        <span className="block truncate text-sm text-muted">{has ? data[name] : hint}</span>
      </span>
    </label>
  );
}

function Check({ name, data, set, errors, children }: FieldProps & { children: ReactNode }) {
  const on = data[name] === "1";
  return (
    <label className="flex cursor-pointer gap-3 text-[0.95rem] leading-relaxed">
      <input type="checkbox" className="sr-only" checked={on} onChange={(e) => set(name, e.target.checked ? "1" : "")} />
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
          on ? "border-gold bg-gold" : errors.includes(name) ? "border-[#c9624f]" : "border-[#cfc8b8]"
        }`}
        aria-hidden="true"
      >
        {on && <IconCheck className="h-3.5 w-3.5" />}
      </span>
      <span className="text-ink/80">{children}</span>
    </label>
  );
}
