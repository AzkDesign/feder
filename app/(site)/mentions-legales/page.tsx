import type { Metadata } from "next";
import { PageHero, ToFill } from "@/components/ui";

export const metadata: Metadata = { title: "Mentions légales" };

export default function MentionsPage() {
  return (
    <>
      <PageHero eyebrow="Informations" title="Mentions légales." />
      <section className="pb-24 md:pb-32">
        <div className="wrap max-w-3xl space-y-10 leading-relaxed text-muted [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink">
          <div>
            <h2>Éditeur du site</h2>
            <p>
              <ToFill>raison sociale</ToFill>, <ToFill>forme juridique</ToFill> au capital de <ToFill>montant</ToFill>, immatriculée au RCS de{" "}
              <ToFill>ville</ToFill> sous le numéro <ToFill>SIREN</ToFill>. Siège social : <ToFill>adresse</ToFill>.
            </p>
            <p className="mt-2">Directeur de la publication : <ToFill>nom</ToFill>.</p>
          </div>
          <div>
            <h2>Statut réglementaire</h2>
            <p>
              <ToFill>statut : établissement de crédit, de paiement, de monnaie électronique ou agent</ToFill>, agréé par{" "}
              <ToFill>autorité de supervision</ToFill> sous le numéro <ToFill>numéro d'agrément</ToFill>.
            </p>
            <p className="mt-2">
              Établissement teneur de compte : <ToFill>nom de l'établissement partenaire</ToFill>.
            </p>
          </div>
          <div>
            <h2>Garantie des dépôts</h2>
            <p>
              <ToFill>mécanisme de garantie applicable, plafond et conditions</ToFill>.
            </p>
          </div>
          <div>
            <h2>Hébergement</h2>
            <p>
              <ToFill>hébergeur, adresse</ToFill>.
            </p>
          </div>
          <div>
            <h2>Médiation</h2>
            <p>
              <ToFill>coordonnées du service réclamations et du médiateur</ToFill>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
