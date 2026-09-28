import type { Metadata } from "next";
import { CtaBand } from "@/components/sections/CtaBand";
import { Tiers } from "@/components/sections/Tiers";
import { PageHero, Reveal, SectionHead } from "@/components/ui";
import { comparison, tiers } from "@/lib/data";

export const metadata: Metadata = {
  title: "Les cartes",
  description: "Feder Or, Feder Platine, Feder Noire : trois cartes en métal, trois niveaux de privilèges.",
};

export default function CartesPage() {
  return (
    <>
      <PageHero
        eyebrow="Les cartes"
        title={<>Choisissez <span className="text-gold-grad">votre métal.</span></>}
        intro="Trois cartes, trois façons de vivre Feder. Toutes en métal, toutes sans frais cachés, toutes accompagnées d'un service d'exception."
      />

      <section className="pb-24 md:pb-32">
        <div className="wrap">
          <Tiers full />
        </div>
      </section>

      <section className="bg-mist py-24 md:py-32">
        <div className="wrap">
          <SectionHead eyebrow="Comparatif" title="Tout, ligne par ligne." />
          <Reveal delay={150} className="mt-12 overflow-x-auto rounded-[24px] border border-line bg-white">
            <table className="w-full min-w-[720px] text-left text-[0.95rem]">
              <thead>
                <tr className="border-b border-line">
                  <th className="p-5 font-normal text-muted md:p-6" scope="col">
                    <span className="sr-only">Caractéristique</span>
                  </th>
                  {tiers.map((t) => (
                    <th key={t.id} scope="col" className="p-5 font-display text-lg font-semibold tracking-tight md:p-6">
                      {t.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.label} className="border-b border-line last:border-0">
                    <th scope="row" className="p-5 font-normal text-muted md:p-6">
                      {row.label}
                    </th>
                    {row.values.map((v, i) => (
                      <td key={i} className={`p-5 md:p-6 ${i === 1 ? "bg-gold-light/15" : ""}`}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
