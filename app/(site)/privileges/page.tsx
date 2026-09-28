import type { Metadata } from "next";
import { CountUp } from "@/components/motion/CountUp";
import { CtaBand } from "@/components/sections/CtaBand";
import { PrivilegeMarquee, PrivilegesGrid } from "@/components/sections/Privileges";
import { PageHero, Reveal, SectionHead } from "@/components/ui";

export const metadata: Metadata = {
  title: "Privilèges",
  description: "Conciergerie 24h/24, salons d'aéroport, assurances premium, cashback et événements privés.",
};

const moments = [
  {
    time: "07:40",
    title: "Aéroport Charles-de-Gaulle",
    text: "Votre vol est retardé. Vous patientez au salon, petit-déjeuner servi, pendant que votre concierge décale votre dîner.",
  },
  {
    time: "13:15",
    title: "New York, Midtown",
    text: "Vous payez en dollars, au taux réel, sans frais. L'opération apparaît dans l'application avant même d'avoir rangé votre carte.",
  },
  {
    time: "20:30",
    title: "Une table complète depuis des semaines",
    text: "Votre concierge a trouvé une place. Et le cashback du repas est déjà crédité sur votre compte.",
  },
];

export default function PrivilegesPage() {
  return (
    <>
      <PageHero
        eyebrow="Privilèges"
        title={<>Le prestige, <span className="text-gold-grad">inclus.</span></>}
        intro="Chaque adhésion Feder donne accès à un ensemble de privilèges pensés pour ceux qui voyagent, reçoivent et exigent le meilleur."
      />

      <section className="pb-24 md:pb-32">
        <div className="wrap">
          <PrivilegesGrid />
        </div>
      </section>

      <PrivilegeMarquee />

      <section className="py-24 md:py-32">
        <div className="wrap">
          <SectionHead eyebrow="Une journée Feder" title="Des privilèges qui se vivent." />
          <div className="mt-14 space-y-4">
            {moments.map((m, i) => (
              <Reveal key={m.time} delay={i * 100} className="grid gap-4 rounded-[24px] border border-line p-7 md:grid-cols-[140px_1fr] md:p-9">
                <div className="font-mono text-2xl text-gold-deep">{m.time}</div>
                <div>
                  <h3 className="font-display text-xl font-semibold tracking-tight">{m.title}</h3>
                  <p className="mt-2 max-w-2xl leading-relaxed text-muted">{m.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink py-24 text-white md:py-28">
        <div className="wrap grid gap-10 md:grid-cols-3">
          {[
            { v: 1300, s: "+", l: "salons d'aéroport accessibles" },
            { v: 2, s: " %", l: "de cashback avec Feder Noire" },
            { v: 150, s: "", l: "devises sans frais de change" },
          ].map((x, i) => (
            <Reveal key={x.l} delay={i * 100}>
              <div className="font-display text-6xl font-semibold tracking-[-0.04em]">
                <CountUp value={x.v} suffix={x.s} className="text-gold-grad" />
              </div>
              <p className="mt-3 text-white/60">{x.l}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
