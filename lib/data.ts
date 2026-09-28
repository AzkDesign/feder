import type { CardVariant } from "@/components/FederCard";

export type Tier = {
  id: CardVariant;
  name: string;
  tagline: string;
  price: string;
  period: string;
  featured?: boolean;
  invite?: boolean;
  features: string[];
};

export const tiers: Tier[] = [
  {
    id: "gold",
    name: "Feder Or",
    tagline: "L'essentiel du prestige, au quotidien.",
    price: "19 €",
    period: "/ mois",
    features: [
      "Carte en métal brossé doré",
      "1 % de cashback sur tous vos achats",
      "Paiements sans frais dans 150 devises",
      "Retraits offerts jusqu'à 400 € / mois à l'étranger",
      "Assurance voyage essentielle",
      "Support prioritaire 7j/7",
    ],
  },
  {
    id: "platine",
    name: "Feder Platine",
    tagline: "Le monde, sans frontière ni file d'attente.",
    price: "49 €",
    period: "/ mois",
    featured: true,
    features: [
      "Carte en métal platiné",
      "1,5 % de cashback sur tous vos achats",
      "Accès à plus de 1 300 salons d'aéroport",
      "Conciergerie 24h/24, 7j/7",
      "Assurances voyage, annulation et location premium",
      "Retraits illimités offerts à l'étranger",
      "Conseiller privé dédié",
    ],
  },
  {
    id: "noire",
    name: "Feder Noire",
    tagline: "Réservée à quelques-uns. Sur invitation.",
    price: "Sur invitation",
    period: "",
    invite: true,
    features: [
      "Carte en métal massif, gravée à votre nom",
      "2 % de cashback sur tous vos achats",
      "Salons illimités, invités inclus",
      "Concierge privé attitré",
      "Plafonds sur mesure",
      "Accès aux événements privés Feder",
      "Banquier privé et gestion patrimoniale",
    ],
  },
];

export const comparison: { label: string; values: [string, string, string] }[] = [
  { label: "Cotisation", values: ["19 € / mois", "49 € / mois", "Sur invitation"] },
  { label: "Matière de la carte", values: ["Métal brossé", "Métal platiné", "Métal massif gravé"] },
  { label: "Cashback", values: ["1 %", "1,5 %", "2 %"] },
  { label: "Plafond de paiement mensuel", values: ["10 000 €", "30 000 €", "Sur mesure"] },
  { label: "Retraits à l'étranger offerts", values: ["400 € / mois", "Illimités", "Illimités"] },
  { label: "Salons d'aéroport", values: ["—", "1 300+ salons", "Illimités + invités"] },
  { label: "Conciergerie", values: ["—", "24h/24", "Concierge attitré"] },
  { label: "Assurance voyage", values: ["Essentielle", "Premium", "Premium Monde"] },
  { label: "Conseiller", values: ["Support prioritaire", "Conseiller dédié", "Banquier privé"] },
  { label: "Événements privés", values: ["—", "Sélection", "Accès complet"] },
];

export const privileges = [
  {
    key: "concierge",
    title: "Conciergerie 24h/24",
    text: "Une table introuvable, un billet complet, un cadeau de dernière minute. Un message suffit, votre concierge s'occupe du reste.",
  },
  {
    key: "lounge",
    title: "Salons d'aéroport",
    text: "Plus de 1 300 salons dans le monde. Attendez votre vol au calme, dans les meilleures conditions.",
  },
  {
    key: "insurance",
    title: "Assurances premium",
    text: "Voyage, annulation, location de véhicule, achats : vous êtes couvert partout, sans démarche superflue.",
  },
  {
    key: "cashback",
    title: "Cashback jusqu'à 2 %",
    text: "Chaque dépense vous rapporte, crédité directement sur votre compte, sans plafond caché.",
  },
  {
    key: "events",
    title: "Événements privés",
    text: "Avant-premières, dîners de chefs, loges sportives : des expériences réservées aux membres Feder.",
  },
  {
    key: "advisor",
    title: "Conseiller privé",
    text: "Un interlocuteur unique, joignable directement, qui connaît votre situation et vos projets.",
  },
] as const;

export const faq = [
  {
    q: "Pourquoi l'accès à Feder se fait-il sur dossier ?",
    a: "Feder s'engage à offrir un service d'exception à chacun de ses membres. L'admission sur dossier nous permet de maintenir ce niveau d'attention, et de proposer à chaque membre l'offre la plus adaptée à sa situation.",
  },
  {
    q: "Combien de temps prend l'étude de mon dossier ?",
    a: "Nos équipes étudient chaque demande sous 48 heures ouvrées. Vous êtes informé par e-mail à chaque étape, et votre carte vous est livrée sous 5 jours après validation.",
  },
  {
    q: "Quels documents dois-je fournir ?",
    a: "Une pièce d'identité en cours de validité, un justificatif de domicile de moins de trois mois, et un justificatif de revenus récent. Des documents complémentaires peuvent être demandés selon l'offre choisie.",
  },
  {
    q: "Puis-je changer d'offre après mon admission ?",
    a: "Oui. Vous pouvez évoluer vers une offre supérieure à tout moment depuis l'application. L'offre Feder Noire est accessible sur invitation uniquement.",
  },
  {
    q: "Comment mes fonds sont-ils protégés ?",
    a: "Vos données sont chiffrées, chaque paiement en ligne est sécurisé par authentification forte et vous pouvez bloquer votre carte instantanément. Les informations sur l'établissement teneur de compte et la garantie des dépôts figurent dans nos mentions légales.",
  },
  {
    q: "Y a-t-il des frais cachés ?",
    a: "Non. La cotisation mensuelle inclut l'ensemble des services de votre offre. Le détail complet figure dans notre page Tarifs.",
  },
];

export const admissionSteps = [
  { title: "Déposez votre dossier", text: "Quelques minutes suffisent pour remplir votre demande en ligne et joindre vos justificatifs." },
  { title: "Étude sous 48 h", text: "Un analyste Feder examine votre dossier avec attention et peut vous contacter pour le compléter." },
  { title: "Validation", text: "Votre admission est confirmée, votre compte est ouvert et votre carte virtuelle est active immédiatement." },
  { title: "Votre carte", text: "Votre carte en métal vous est livrée en main propre, sous 5 jours ouvrés." },
];
