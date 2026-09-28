/* Shared (client + server) banking labels and rules. */

export const categories: Record<string, { label: string; icon: string }> = {
  restaurants: { label: "Restaurants", icon: "M7 3v8a2 2 0 0 0 2 2v8M11 3v8M9 3v8M17 21V3c-2 0-3.5 2-3.5 6v4H17" },
  voyage: { label: "Voyage", icon: "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" },
  hotels: { label: "Hôtels", icon: "M3 21V7M3 13h18v8M21 13a4 4 0 0 0-4-4h-6v4M7 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" },
  shopping: { label: "Shopping", icon: "M6 7h12l1 14H5zM9 7a3 3 0 0 1 6 0" },
  loisirs: { label: "Loisirs", icon: "M12 3l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.9L6.6 19.6l1-6L3.3 9.4l6-.9z" },
  transport: { label: "Transport", icon: "M5 17h14M6 17V8a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v9M7 20h.01M17 20h.01M6 12h12" },
  services: { label: "Services", icon: "M4 6h16M4 12h16M4 18h10" },
  autre: { label: "Autre", icon: "M12 12h.01M8 12h.01M16 12h.01" },
};

export const kindLabel: Record<string, string> = {
  card: "Paiement carte",
  withdrawal: "Retrait",
  deposit: "Versement",
  transfer_out: "Virement émis",
  transfer_in: "Virement reçu",
  feder_pay_out: "Feder Pay envoyé",
  feder_pay_in: "Feder Pay reçu",
  vault_in: "Vers un coffre",
  vault_out: "Depuis un coffre",
  cashback: "Cashback",
};

export const offerRules = {
  gold: { cashbackBps: 100, maxPayment: 10_000_00, maxWithdrawal: 1_500_00, lounge: false },
  platine: { cashbackBps: 150, maxPayment: 30_000_00, maxWithdrawal: 5_000_00, lounge: true },
  noire: { cashbackBps: 200, maxPayment: 100_000_00, maxWithdrawal: 20_000_00, lounge: true },
} as const;

export const vaultIcons: Record<string, string> = {
  star: "M12 3l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.9L6.6 19.6l1-6L3.3 9.4l6-.9z",
  plane: categories.voyage.icon,
  home: "M3 11 12 4l9 7M5 10v10h14V10",
  car: "M5 17h14M6 17l1.5-6h9L18 17M7 20h.01M17 20h.01",
  gift: "M4 8h16v4H4zM5 12v8h14v-8M12 8v12M12 8S10.5 4 8 5s1.5 3 4 3zM12 8s1.5-4 4-3-1.5 3-4 3z",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
};

export const fmtCents = (c: number, sign = false) => {
  const s = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(c / 100);
  return sign && c > 0 ? `+ ${s}` : c < 0 ? s.replace("-", "− ") : s;
};

export const fmtIban = (iban: string) => iban.replace(/(.{4})/g, "$1 ").trim();

export const upcomingEvents = [
  {
    key: "diner-etoile-2026-11",
    title: "Dîner à quatre mains",
    place: "Paris 8e · Maison partenaire",
    date: "2026-11-14T20:00:00+01:00",
    text: "Deux chefs étoilés, un menu unique de sept services, vingt-quatre convives.",
    tiers: ["platine", "noire"],
    capacity: 24,
  },
  {
    key: "avant-premiere-2026-11",
    title: "Avant-première privée",
    place: "Paris · Salle privatisée",
    date: "2026-11-27T19:30:00+01:00",
    text: "Projection en avant-première suivie d'un cocktail en présence de l'équipe du film.",
    tiers: ["gold", "platine", "noire"],
    capacity: 120,
  },
  {
    key: "galerie-2026-12",
    title: "Vernissage nocturne",
    place: "Paris 3e · Galerie contemporaine",
    date: "2026-12-05T21:00:00+01:00",
    text: "Visite guidée par le commissaire de l'exposition, avant l'ouverture au public.",
    tiers: ["platine", "noire"],
    capacity: 40,
  },
  {
    key: "chalet-2027-01",
    title: "Week-end au chalet",
    place: "Alpes · Station privée",
    date: "2027-01-22T17:00:00+01:00",
    text: "Trois jours en petit comité : ski hors-piste encadré, spa et dîners au coin du feu.",
    tiers: ["noire"],
    capacity: 12,
  },
] as const;
