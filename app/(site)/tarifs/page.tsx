import type { Metadata } from "next";
import { PageHero, Reveal } from "@/components/ui";

export const metadata: Metadata = {
  title: "Tarifs",
  description: "Conditions tarifaires des offres Feder Or, Platine et Noire.",
};

const sections = [
  {
    title: "Cotisations",
    rows: [
      ["Cotisation mensuelle", "19 €", "49 €", "Sur invitation"],
      ["Frais d'ouverture de compte", "Offerts", "Offerts", "Offerts"],
      ["Carte supplémentaire", "9 € / mois", "Offerte", "Offerte"],
      ["Remplacement de carte", "25 €", "Offert", "Offert"],
    ],
  },
  {
    title: "Opérations courantes",
    rows: [
      ["Paiements en euros", "Gratuits", "Gratuits", "Gratuits"],
      ["Paiements en devises", "Gratuits", "Gratuits", "Gratuits"],
      ["Retraits zone euro", "Gratuits", "Gratuits", "Gratuits"],
      ["Retraits hors zone euro", "Gratuits jusqu'à 400 € / mois, puis 2 %", "Gratuits", "Gratuits"],
      ["Virements SEPA et instantanés", "Gratuits", "Gratuits", "Gratuits"],
    ],
  },
  {
    title: "Services",
    rows: [
      ["Conciergerie", "—", "Incluse", "Concierge attitré"],
      ["Salons d'aéroport", "—", "Inclus (titulaire)", "Inclus + invités"],
      ["Assurances voyage", "Essentielle", "Premium", "Premium Monde"],
    ],
  },
];

export default function TarifsPage() {
  return (
    <>
      <PageHero
        eyebrow="Tarifs"
        title="Transparence totale."
        intro="Une cotisation, des services inclus, aucun frais caché. Voici le détail complet de nos conditions."
      />
      <section className="pb-24 md:pb-32">
        <div className="wrap space-y-10">
          {sections.map((s) => (
            <Reveal key={s.title} className="overflow-x-auto rounded-[24px] border border-line">
              <table className="w-full min-w-[720px] text-left text-[0.95rem]">
                <caption className="border-b border-line bg-mist p-5 text-left font-display text-lg font-semibold md:p-6">{s.title}</caption>
                <thead>
                  <tr className="border-b border-line text-sm text-muted">
                    <th scope="col" className="p-5 font-normal md:px-6">Prestation</th>
                    <th scope="col" className="p-5 font-normal md:px-6">Feder Or</th>
                    <th scope="col" className="p-5 font-normal md:px-6">Feder Platine</th>
                    <th scope="col" className="p-5 font-normal md:px-6">Feder Noire</th>
                  </tr>
                </thead>
                <tbody>
                  {s.rows.map(([label, ...vals]) => (
                    <tr key={label} className="border-b border-line last:border-0">
                      <th scope="row" className="p-5 font-normal text-muted md:px-6">{label}</th>
                      {vals.map((v, i) => (
                        <td key={i} className="p-5 md:px-6">{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Reveal>
          ))}
          <p className="text-sm text-muted">
            Tarifs indicatifs à valider avant mise en ligne. Les conditions contractuelles complètes sont remises lors de l'ouverture du compte.
          </p>
        </div>
      </section>
    </>
  );
}
