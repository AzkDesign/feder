import type { Metadata } from "next";
import { PageHero, ToFill } from "@/components/ui";

export const metadata: Metadata = { title: "Confidentialité" };

export default function ConfidentialitePage() {
  return (
    <>
      <PageHero eyebrow="Informations" title="Politique de confidentialité." intro="La protection de vos données personnelles est au cœur de notre engagement." />
      <section className="pb-24 md:pb-32">
        <div className="wrap max-w-3xl space-y-10 leading-relaxed text-muted [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          <div>
            <h2>Responsable du traitement</h2>
            <p>
              <ToFill>raison sociale et adresse</ToFill>. Délégué à la protection des données : <ToFill>contact DPO</ToFill>.
            </p>
          </div>
          <div>
            <h2>Données collectées</h2>
            <ul>
              <li>Données d'identité et de contact fournies lors de la demande d'admission.</li>
              <li>Informations sur votre situation professionnelle et financière.</li>
              <li>Justificatifs transmis (identité, domicile, revenus).</li>
              <li>Données d'utilisation du site et de l'application.</li>
            </ul>
          </div>
          <div>
            <h2>Finalités</h2>
            <p>
              Étude de votre demande d'admission, respect de nos obligations légales (connaissance client, lutte contre le blanchiment), gestion de
              la relation et amélioration de nos services.
            </p>
          </div>
          <div>
            <h2>Durée de conservation</h2>
            <p>
              <ToFill>durées de conservation par catégorie de données</ToFill>.
            </p>
          </div>
          <div>
            <h2>Vos droits</h2>
            <p>
              Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité. Pour les exercer :{" "}
              <ToFill>adresse de contact</ToFill>. Vous pouvez également introduire une réclamation auprès de la CNIL.
            </p>
          </div>
          <div id="cookies" className="scroll-mt-32">
            <h2>Cookies</h2>
            <p>
              Ce site n'utilise actuellement aucun cookie publicitaire. <ToFill>liste des cookies et outil de gestion du consentement si vous ajoutez des outils de mesure d'audience</ToFill>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
