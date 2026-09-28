import type { Metadata } from "next";
import { IconBellAlert, IconBolt, IconCard, IconChart, IconGlobe, IconSnow, IconUser, IconVault } from "@/components/Icons";
import { CtaBand } from "@/components/sections/CtaBand";
import { PhoneMockup } from "@/components/sections/PhoneMockup";
import { PageHero, Reveal, SectionHead } from "@/components/ui";

export const metadata: Metadata = {
  title: "L'application",
  description: "Virements instantanés, 150 devises, coffres d'épargne, cartes virtuelles : toute votre banque dans l'application Feder.",
};

const features = [
  { Icon: IconBolt, t: "Virements instantanés", d: "Envoyez de l'argent en France et en Europe en quelques secondes, à toute heure." },
  { Icon: IconGlobe, t: "Multi-devises", d: "Détenez, échangez et dépensez dans 150 devises au taux de change réel." },
  { Icon: IconVault, t: "Coffres d'épargne", d: "Créez des coffres par projet et automatisez vos versements." },
  { Icon: IconCard, t: "Cartes virtuelles", d: "Générez une carte à usage unique pour vos achats en ligne." },
  { Icon: IconChart, t: "Analyse des dépenses", d: "Catégorisation automatique, budgets et tendances mensuelles." },
  { Icon: IconSnow, t: "Contrôle de la carte", d: "Gel, plafonds, paiements à l'étranger : tout se règle en un geste." },
  { Icon: IconBellAlert, t: "Notifications instantanées", d: "Chaque paiement vous est notifié en temps réel." },
  { Icon: IconUser, t: "Conseiller en direct", d: "Écrivez à votre conseiller ou à votre concierge depuis l'application." },
];

export default function ApplicationPage() {
  return (
    <>
      <PageHero
        eyebrow="L'application"
        title={<>Votre banque, <span className="text-gold-grad">à la seconde.</span></>}
        intro="Une application rapide, claire et élégante. Tout ce dont vous avez besoin, rien de superflu."
      />

      <section className="pb-24 md:pb-32">
        <div className="wrap grid items-center gap-16 lg:grid-cols-[1fr_1.4fr]">
          <Reveal>
            <PhoneMockup />
          </Reveal>
          <div className="grid gap-x-10 gap-y-9 sm:grid-cols-2">
            {features.map(({ Icon, t, d }, i) => (
              <Reveal key={t} delay={(i % 2) * 90} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold-light/40 text-gold-deep">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">{t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-mist py-24 md:py-32">
        <div className="wrap">
          <SectionHead
            center
            eyebrow="Disponibilité"
            title="Sur iOS, Android et le web."
            intro="Téléchargez l'application après validation de votre admission. Votre carte virtuelle est active immédiatement."
          />
          <Reveal delay={200} className="mt-10 flex flex-wrap justify-center gap-3">
            {["App Store", "Google Play", "Version web"].map((s) => (
              <span key={s} className="rounded-full border border-line bg-white px-6 py-3 text-sm font-medium">
                {s}
              </span>
            ))}
          </Reveal>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
