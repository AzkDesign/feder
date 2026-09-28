import { FederCard } from "@/components/FederCard";
import { IconCheck } from "@/components/Icons";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { Reveal } from "@/components/ui";
import { tiers } from "@/lib/data";

export function Tiers({ full = false }: { full?: boolean }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {tiers.map((t, i) => (
        <Reveal
          key={t.id}
          delay={i * 110}
          className={`relative flex flex-col rounded-[28px] border p-7 md:p-8 ${
            t.id === "noire"
              ? "border-ink bg-ink text-white"
              : t.featured
                ? "border-gold/50 bg-gradient-to-b from-gold-light/35 to-white shadow-[0_30px_60px_-30px_rgba(140,107,18,0.35)]"
                : "border-line bg-white"
          }`}
        >
          {t.featured && (
            <span className="absolute right-6 top-6 rounded-full bg-ink px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-gold-light">
              Recommandée
            </span>
          )}
          <FederCard variant={t.id} interactive className="w-[78%] max-w-[300px]" />

          <h3 className="mt-8 font-display text-2xl font-semibold tracking-tight">{t.name}</h3>
          <p className={`mt-2 text-[0.95rem] ${t.id === "noire" ? "text-white/60" : "text-muted"}`}>{t.tagline}</p>

          <div className="mt-6 flex items-baseline gap-1.5">
            <span className={`font-display text-4xl font-semibold tracking-tight ${t.invite ? "text-gold-grad text-3xl" : ""}`}>{t.price}</span>
            {t.period && <span className={t.id === "noire" ? "text-white/50" : "text-muted"}>{t.period}</span>}
          </div>

          <ul className={`mt-6 space-y-3 text-[0.94rem] ${full ? "" : "flex-1"}`}>
            {(full ? t.features : t.features.slice(0, 4)).map((f) => (
              <li key={f} className="flex gap-3">
                <IconCheck className={`mt-0.5 h-5 w-5 shrink-0 ${t.id === "noire" ? "text-gold-light" : "text-gold-deep"}`} />
                <span className={t.id === "noire" ? "text-white/80" : "text-ink/80"}>{f}</span>
              </li>
            ))}
          </ul>

          <div className={full ? "mt-auto pt-8" : "pt-8"}>
            <MagneticButton
              href={t.invite ? "/admission?offre=noire" : `/admission?offre=${t.id}`}
              variant={t.id === "noire" ? "light" : t.featured ? "gold" : "dark"}
              className="w-full"
            >
              {t.invite ? "Solliciter une invitation" : `Choisir ${t.name}`}
            </MagneticButton>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
