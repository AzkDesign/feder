import type { Metadata } from "next";
import { IconBellAlert, IconFingerprint, IconLock, IconShield, IconSnow, IconUser } from "@/components/Icons";
import { CtaBand } from "@/components/sections/CtaBand";
import { PageHero, Reveal, SectionHead, ToFill } from "@/components/ui";

export const metadata: Metadata = {
  title: "Sécurité",
  description: "Chiffrement, authentification forte, gel instantané de la carte : comment Feder protège vos fonds et vos données.",
};

const items = [
  { Icon: IconLock, t: "Données chiffrées", d: "Vos données sont chiffrées en transit et au repos, selon les standards du secteur bancaire." },
  { Icon: IconFingerprint, t: "Authentification forte", d: "Chaque connexion et chaque paiement en ligne sont validés par biométrie ou code personnel." },
  { Icon: IconSnow, t: "Gel instantané", d: "Carte égarée ? Gelez-la en un geste, puis réactivez-la si vous la retrouvez." },
  { Icon: IconBellAlert, t: "Alertes en temps réel", d: "Chaque opération vous est notifiée immédiatement. Rien ne vous échappe." },
  { Icon: IconShield, t: "Surveillance des fraudes", d: "Les opérations inhabituelles sont détectées et bloquées avant qu'elles n'aboutissent." },
  { Icon: IconUser, t: "Équipe dédiée", d: "Une équipe sécurité joignable à toute heure en cas de doute." },
];

export default function SecuritePage() {
  return (
    <>
      <PageHero
        eyebrow="Sécurité"
        title={<>Protégé, <span className="text-gold-grad">sans y penser.</span></>}
        intro="La sécurité ne devrait jamais être une contrainte. Chez Feder, elle travaille en silence, à chaque instant."
      />

      <section className="pb-24 md:pb-32">
        <div className="wrap grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ Icon, t, d }, i) => (
            <Reveal key={t} delay={(i % 3) * 90} className="rounded-[24px] border border-line p-8">
              <Icon className="h-7 w-7 text-gold-deep" />
              <h3 className="mt-6 font-display text-xl font-semibold tracking-tight">{t}</h3>
              <p className="mt-3 leading-relaxed text-muted">{d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-mist py-24 md:py-28">
        <div className="wrap grid gap-10 lg:grid-cols-2">
          <SectionHead eyebrow="Protection des fonds" title="Où sont conservés vos fonds." />
          <Reveal delay={150} className="space-y-4 text-lg leading-relaxed text-muted">
            <p>
              Les fonds des membres Feder sont conservés auprès de <ToFill>établissement teneur de compte</ToFill>, établissement agréé par{" "}
              <ToFill>autorité de supervision</ToFill>.
            </p>
            <p>
              Les dépôts sont couverts par <ToFill>mécanisme de garantie des dépôts et plafond</ToFill>.
            </p>
            <p className="text-sm">
              Ces informations réglementaires doivent être renseignées avec les données exactes de votre établissement avant toute mise en ligne.
            </p>
          </Reveal>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
