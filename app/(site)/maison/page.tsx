import type { Metadata } from "next";
import { FederCard } from "@/components/FederCard";
import { CtaBand } from "@/components/sections/CtaBand";
import { PageHero, Reveal, SectionHead } from "@/components/ui";

export const metadata: Metadata = {
  title: "La Maison",
  description: "La vision de Feder : allier l'agilité d'une banque en ligne à l'exigence d'une maison de prestige.",
};

const values = [
  { n: "01", t: "L'exigence", d: "Chaque détail compte : la matière de la carte, la vitesse de l'application, le ton d'une réponse." },
  { n: "02", t: "La discrétion", d: "Vos affaires restent les vôtres. Nous protégeons vos données comme nous protégeons vos fonds." },
  { n: "03", t: "La proximité", d: "Un interlocuteur qui vous connaît, joignable directement. Pas de file d'attente, pas de script." },
  { n: "04", t: "La transparence", d: "Une cotisation claire, des avantages lisibles. Aucun frais caché, jamais." },
];

export default function MaisonPage() {
  return (
    <>
      <PageHero
        eyebrow="La Maison"
        title={<>Né d'une conviction : <span className="text-gold-grad">le prestige peut être moderne.</span></>}
        intro="Feder est née d'un constat simple. Les banques privées offrent le service, les néobanques offrent la vitesse. Personne n'offrait les deux."
      />

      <section className="pb-24 md:pb-32">
        <div className="wrap grid items-center gap-16 lg:grid-cols-2">
          <Reveal className="space-y-6 text-lg leading-relaxed text-muted">
            <p>
              Nous avons imaginé une banque qui traite chaque membre comme un client privé, tout en offrant la fluidité d'une application pensée
              pour aujourd'hui.
            </p>
            <p>
              L'admission sur dossier n'est pas une barrière : c'est un engagement. Celui de consacrer à chaque membre le temps et l'attention qu'il
              mérite.
            </p>
            <p className="font-display text-2xl font-medium leading-snug tracking-tight text-ink">
              « Nous ne voulons pas être la plus grande banque. Nous voulons être la meilleure pour chacun de nos membres. »
            </p>
          </Reveal>
          <Reveal delay={150} className="relative mx-auto grid w-full max-w-[460px]">
            <FederCard variant="platine" className="w-[80%] -rotate-6" />
            <FederCard variant="gold" className="-mt-[32%] ml-auto w-[80%] rotate-3" />
          </Reveal>
        </div>
      </section>

      <section className="bg-mist py-24 md:py-32">
        <div className="wrap">
          <SectionHead eyebrow="Nos valeurs" title="Ce qui nous guide." />
          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {values.map((v, i) => (
              <Reveal key={v.n} delay={(i % 2) * 100} className="rounded-[24px] border border-line bg-white p-8 md:p-10">
                <span className="font-mono text-sm text-gold-deep">{v.n}</span>
                <h3 className="mt-5 font-display text-2xl font-semibold tracking-tight">{v.t}</h3>
                <p className="mt-3 leading-relaxed text-muted">{v.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
