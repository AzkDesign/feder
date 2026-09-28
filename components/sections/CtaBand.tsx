import { FederCard } from "@/components/FederCard";
import { IconArrow } from "@/components/Icons";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { Eyebrow, Reveal } from "@/components/ui";

export function CtaBand() {
  return (
    <section className="bg-white py-24 md:py-32">
      <div className="wrap">
        <div className="relative overflow-hidden rounded-[36px] bg-ink px-7 py-16 text-white md:px-16 md:py-20">
          <div
            className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(212,175,55,0.28), rgba(212,175,55,0) 62%)" }}
            aria-hidden="true"
          />
          <div className="relative grid items-center gap-14 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <Reveal>
                <Eyebrow light>Admission</Eyebrow>
              </Reveal>
              <Reveal delay={80}>
                <h2 className="mt-5 font-display text-[clamp(2.2rem,5vw,4rem)] font-semibold leading-[1.02] tracking-[-0.04em]">
                  Votre place <span className="text-gold-grad">vous attend.</span>
                </h2>
              </Reveal>
              <Reveal delay={160}>
                <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/60">
                  Déposez votre dossier en quelques minutes. Réponse sous 48 heures ouvrées.
                </p>
              </Reveal>
              <Reveal delay={240} className="mt-10 flex flex-wrap gap-3">
                <MagneticButton href="/admission" size="lg">
                  Demander mon admission <IconArrow className="h-4 w-4" />
                </MagneticButton>
                <MagneticButton href="/cartes" variant="light" size="lg">
                  Comparer les cartes
                </MagneticButton>
              </Reveal>
            </div>
            <Reveal delay={200} className="mx-auto w-full max-w-[420px]">
              <FederCard variant="noire" interactive float />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
