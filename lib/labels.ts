/* Shared labels (safe to import on client and server). */

export type AppStatus = "nouvelle" | "en_etude" | "complement" | "validee" | "refusee";
export type MemberStatus = "actif" | "suspendu" | "cloture";
export type CardStatus = "en_fabrication" | "expediee" | "active" | "gelee" | "opposee";
export type Offer = "gold" | "platine" | "noire";

type Tone = "neutral" | "info" | "warning" | "good" | "critical";

export const appStatus: Record<AppStatus, { label: string; tone: Tone; public: string }> = {
  nouvelle: { label: "Nouvelle", tone: "info", public: "Dossier reçu" },
  en_etude: { label: "En étude", tone: "neutral", public: "En cours d'examen" },
  complement: { label: "Complément demandé", tone: "warning", public: "Informations complémentaires requises" },
  validee: { label: "Validée", tone: "good", public: "Admission validée" },
  refusee: { label: "Refusée", tone: "critical", public: "Demande non retenue" },
};

export const memberStatus: Record<MemberStatus, { label: string; tone: Tone }> = {
  actif: { label: "Actif", tone: "good" },
  suspendu: { label: "Suspendu", tone: "warning" },
  cloture: { label: "Clôturé", tone: "neutral" },
};

export const cardStatus: Record<CardStatus, { label: string; tone: Tone }> = {
  en_fabrication: { label: "En fabrication", tone: "info" },
  expediee: { label: "Expédiée", tone: "info" },
  active: { label: "Active", tone: "good" },
  gelee: { label: "Gelée", tone: "warning" },
  opposee: { label: "En opposition", tone: "critical" },
};

export const offerLabel: Record<Offer, string> = {
  gold: "Feder Or",
  platine: "Feder Platine",
  noire: "Feder Noire",
};

export const roleLabel = { super_admin: "Super admin", analyste: "Analyste" } as const;

export const docKindLabel: Record<string, string> = {
  identite: "Pièce d'identité",
  domicile: "Justificatif de domicile",
  revenus: "Justificatif de revenus",
  complement: "Document complémentaire",
};

export const actionLabel: Record<string, string> = {
  demande_deposee: "Demande déposée",
  statut_modifie: "Statut modifié",
  complement_demande: "Complément demandé",
  complement_recu: "Complément reçu",
  demande_validee: "Demande validée",
  demande_refusee: "Demande refusée",
  demande_assignee: "Dossier assigné",
  document_consulte: "Document consulté",
  note_ajoutee: "Note interne ajoutée",
  membre_cree: "Membre créé",
  membre_modifie: "Membre modifié",
  carte_modifiee: "Statut de carte modifié",
  offre_modifiee: "Offre modifiée",
  connexion: "Connexion",
  connexion_echouee: "Échec de connexion",
  deconnexion: "Déconnexion",
  mot_de_passe_modifie: "Mot de passe modifié",
  admin_cree: "Compte équipe créé",
  admin_modifie: "Compte équipe modifié",
  mot_de_passe_reinitialise: "Mot de passe réinitialisé",
  parametres_modifies: "Paramètres modifiés",
  export: "Export CSV",
  donnees_demo: "Données de démonstration générées",
  lien_activation: "Lien d'activation généré",
  espace_active: "Espace client activé",
  membre_connexion: "Connexion à l'espace client",
  membre_connexion_echouee: "Échec de connexion à l'espace client",
  membre_2fa_echouee: "Code de sécurité erroné",
  feder_pay: "Feder Pay envoyé",
  virement_emis: "Virement émis",
  beneficiaire_ajoute: "Bénéficiaire ajouté",
  carte_gelee: "Carte gelée par le membre",
  carte_degelee: "Carte dégelée par le membre",
  carte_opposition: "Opposition sur la carte",
  carte_reglages: "Réglages de carte modifiés",
  carte_details: "Détails de carte consultés",
  carte_virtuelle: "Carte virtuelle créée",
  mot_de_passe_membre: "Mot de passe modifié par le membre",
  codes_secours: "Codes de secours régénérés",
  sessions_revoquees: "Autres sessions déconnectées",
  depot_simule: "Versement (simulation)",
  paiement_simule: "Paiement carte (simulation)",
  message_conciergerie: "Message à la conciergerie",
  reponse_conciergerie: "Réponse de la conciergerie",
};

export const toneClass: Record<Tone, string> = {
  neutral: "bg-ink/[0.06] text-ink/75 ring-ink/10",
  info: "bg-[#e8eefb] text-[#2b4a8a] ring-[#2b4a8a]/15",
  warning: "bg-[#fbf1dc] text-[#8a5a00] ring-[#8a5a00]/15",
  good: "bg-[#e3f3e8] text-[#1f6b3a] ring-[#1f6b3a]/15",
  critical: "bg-[#fbe6e3] text-[#a33a2a] ring-[#a33a2a]/15",
};

export const toneDot: Record<Tone, string> = {
  neutral: "bg-ink/40",
  info: "bg-[#2b4a8a]",
  warning: "bg-[#b07a0c]",
  good: "bg-[#1f6b3a]",
  critical: "bg-[#a33a2a]",
};

export function fmtDate(iso?: string | null, withTime = false) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Europe/Paris",
  }).format(new Date(iso));
}

export function fmtAge(iso: string) {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600_000);
  if (h < 1) return "< 1 h";
  if (h < 48) return `${h} h`;
  return `${Math.floor(h / 24)} j`;
}

export const fmtEur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
