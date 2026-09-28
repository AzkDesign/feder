import Link from "next/link";
import { Logo } from "./Logo";

const cols = [
  {
    title: "Offres",
    links: [
      { href: "/cartes", label: "Les cartes" },
      { href: "/privileges", label: "Privilèges" },
      { href: "/tarifs", label: "Tarifs" },
      { href: "/admission", label: "Demander l'admission" },
      { href: "/suivi", label: "Suivre ma demande" },
    ],
  },
  {
    title: "Feder",
    links: [
      { href: "/maison", label: "La Maison" },
      { href: "/application", label: "L'application" },
      { href: "/securite", label: "Sécurité" },
      { href: "/espace", label: "Espace client" },
    ],
  },
  {
    title: "Informations",
    links: [
      { href: "/mentions-legales", label: "Mentions légales" },
      { href: "/confidentialite", label: "Confidentialité" },
      { href: "/confidentialite#cookies", label: "Cookies" },
      { href: "/tarifs", label: "Conditions tarifaires" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-ink text-white">
      <div className="wrap pb-10 pt-20">
        <div className="grid gap-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo light />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/50">
              La banque en ligne de prestige. Accessible sur admission.
            </p>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold-light/70">{col.title}</div>
              <ul className="mt-5 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-white/65 transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="hairline-gold mt-16 opacity-40" />

        <div className="mt-8 flex flex-col gap-4 text-xs leading-relaxed text-white/40 md:flex-row md:justify-between">
          <p className="max-w-3xl">
            Feder est une marque de [raison sociale à compléter], [statut réglementaire et numéro d'agrément à compléter].
            Les services bancaires sont fournis par [établissement teneur de compte à compléter].
          </p>
          <p>© {new Date().getFullYear()} Feder. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
