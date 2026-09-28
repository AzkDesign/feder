"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clientIp, logEvent } from "@/lib/server/audit";
import { createSession, destroySession, getAdmin, requireAdmin } from "@/lib/server/auth";
import { hashPassword, randomCode, tempPassword, verifyPassword } from "@/lib/server/crypto";
import { get, getSettings, now, run, tx } from "@/lib/server/db";
import { hit, isBlocked, reset } from "@/lib/server/rate-limit";
import { appStatus, cardStatus, memberStatus, offerLabel, type AppStatus } from "@/lib/labels";

export type FormState = { error?: string; ok?: string; secret?: string } | undefined;

/* A business-rule violation: shown to the admin as a banner (?erreur=…), never a crash. */
class UserError extends Error {}

/** Run a mutation and come back to `path` with ?ok= or ?erreur=. */
async function act(path: string, okMsg: string, fn: () => Promise<void>) {
  try {
    await fn();
  } catch (e) {
    if (e instanceof UserError) redirect(`${path}?erreur=${encodeURIComponent(e.message)}`);
    throw e; // includes Next's own redirect signals (e.g. from requireAdmin)
  }
  redirect(`${path}?ok=${encodeURIComponent(okMsg)}`);
}

const str = (fd: FormData, k: string, max = 2000) => String(fd.get(k) ?? "").trim().slice(0, max);
const int = (fd: FormData, k: string) => {
  const n = Number(fd.get(k));
  if (!Number.isInteger(n) || n <= 0) throw new UserError("Identifiant invalide.");
  return n;
};

/* ───────────────────────── Auth ───────────────────────── */

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW = 15 * 60_000;
let dummyHash: string | undefined;

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email", 160).toLowerCase();
  const password = String(fd.get("password") ?? "");
  const ip = await clientIp();
  const key = `login:${email}:${ip}`;

  if (isBlocked(key, LOGIN_LIMIT, LOGIN_WINDOW)) {
    return { error: "Trop de tentatives. Réessayez dans 15 minutes." };
  }

  const admin = get<{ id: number; password_hash: string; active: number; must_change_password: number }>(
    "SELECT id, password_hash, active, must_change_password FROM admins WHERE email = ?",
    email,
  );
  // Always run a full hash comparison so timing doesn't reveal whether the account exists.
  dummyHash ??= hashPassword(randomCode(16));
  const valid = verifyPassword(password, admin?.password_hash ?? dummyHash);

  if (!admin || !valid || !admin.active) {
    hit(key, LOGIN_LIMIT, LOGIN_WINDOW);
    await logEvent({ entityType: "auth", actorType: "systeme", action: "connexion_echouee", detail: email });
    return { error: "Identifiants incorrects." };
  }

  reset(key);
  run("UPDATE admins SET last_login_at = ? WHERE id = ?", now(), admin.id);
  await createSession(admin.id, ip);
  await logEvent({ entityType: "auth", actorType: "admin", actorId: admin.id, action: "connexion" });
  redirect(admin.must_change_password ? "/admin/compte?premiere=1" : "/admin");
}

export async function logoutAction() {
  const admin = await getAdmin();
  if (admin) await logEvent({ entityType: "auth", actorType: "admin", actorId: admin.id, action: "deconnexion" });
  await destroySession();
  redirect("/admin/connexion");
}

export async function changePasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin(undefined, { allowPasswordChange: true });
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const confirm = String(fd.get("confirm") ?? "");

  const row = get<{ password_hash: string }>("SELECT password_hash FROM admins WHERE id = ?", admin.id)!;
  if (!verifyPassword(current, row.password_hash)) return { error: "Mot de passe actuel incorrect." };
  if (next.length < 12) return { error: "Le nouveau mot de passe doit contenir au moins 12 caractères." };
  if (!/[a-z]/.test(next) || !/[A-Z]/.test(next) || !/\d/.test(next)) {
    return { error: "Utilisez au moins une minuscule, une majuscule et un chiffre." };
  }
  if (next !== confirm) return { error: "Les deux mots de passe ne correspondent pas." };
  if (next === current) return { error: "Choisissez un mot de passe différent de l'actuel." };

  run("UPDATE admins SET password_hash = ?, must_change_password = 0 WHERE id = ?", hashPassword(next), admin.id);
  await logEvent({ entityType: "admin", entityId: admin.id, actorType: "admin", actorId: admin.id, action: "mot_de_passe_modifie" });
  if (admin.must_change_password) redirect("/admin");
  return { ok: "Mot de passe mis à jour." };
}

/* ───────────────────────── Applications ───────────────────────── */

type AppRow = { id: number; status: AppStatus; reference: string };

function loadApp(id: number) {
  const app = get<AppRow>("SELECT id, status, reference FROM applications WHERE id = ?", id);
  if (!app) throw new UserError("Dossier introuvable.");
  return app;
}

function assertFrom(app: AppRow, allowed: AppStatus[]) {
  if (!allowed.includes(app.status)) {
    throw new UserError(`Action impossible : le dossier est « ${appStatus[app.status].label} ».`);
  }
}

const appPath = (fd: FormData) => `/admin/demandes/${Number(fd.get("id")) || ""}`;

function touchApps(id: number) {
  revalidatePath("/admin");
  revalidatePath("/admin/demandes");
  revalidatePath(`/admin/demandes/${id}`);
}

export async function takeApplication(fd: FormData) {
  await act(appPath(fd), "Dossier pris en charge.", async () => {
    const admin = await requireAdmin();
    const app = loadApp(int(fd, "id"));
    assertFrom(app, ["nouvelle", "en_etude", "complement"]);
    run(
      "UPDATE applications SET assigned_to = ?, status = CASE WHEN status = 'nouvelle' THEN 'en_etude' ELSE status END, updated_at = ? WHERE id = ?",
      admin.id, now(), app.id,
    );
    await logEvent({ entityType: "application", entityId: app.id, actorType: "admin", actorId: admin.id, action: "demande_assignee", detail: admin.name });
    if (app.status === "nouvelle") {
      await logEvent({
        entityType: "application", entityId: app.id, actorType: "admin", actorId: admin.id,
        action: "statut_modifie", detail: appStatus.en_etude.public, public: true,
      });
    }
    touchApps(app.id);
  });
}

export async function assignApplication(fd: FormData) {
  await act(appPath(fd), "Assignation mise à jour.", async () => {
    const admin = await requireAdmin();
    const app = loadApp(int(fd, "id"));
    const to = Number(fd.get("adminId")) || null;
    const target = to ? get<{ name: string }>("SELECT name FROM admins WHERE id = ? AND active = 1", to) : null;
    if (to && !target) throw new UserError("Membre de l'équipe introuvable.");
    run("UPDATE applications SET assigned_to = ?, updated_at = ? WHERE id = ?", to, now(), app.id);
    await logEvent({
      entityType: "application", entityId: app.id, actorType: "admin", actorId: admin.id,
      action: "demande_assignee", detail: target?.name ?? "Non assigné",
    });
    touchApps(app.id);
  });
}

export async function requestComplement(fd: FormData) {
  await act(appPath(fd), "Demande de complément envoyée au candidat.", async () => {
    const admin = await requireAdmin();
    const app = loadApp(int(fd, "id"));
    assertFrom(app, ["nouvelle", "en_etude", "complement"]);
    const message = str(fd, "message");
    if (!message) throw new UserError("Précisez au candidat les éléments attendus.");
    run(
      "UPDATE applications SET status = 'complement', public_message = ?, assigned_to = COALESCE(assigned_to, ?), updated_at = ? WHERE id = ?",
      message, admin.id, now(), app.id,
    );
    await logEvent({
      entityType: "application", entityId: app.id, actorType: "admin", actorId: admin.id,
      action: "complement_demande", detail: message, public: true,
    });
    touchApps(app.id);
  });
}

export async function validateApplication(fd: FormData) {
  await act(appPath(fd), "Admission validée, membre créé.", async () => {
    const admin = await requireAdmin();
    const app = loadApp(int(fd, "id"));
    assertFrom(app, ["nouvelle", "en_etude", "complement"]);
    const message =
      str(fd, "message") ||
      "Félicitations, votre admission est validée. Bienvenue chez Feder. Votre carte est en cours de fabrication et vous sera livrée sous 5 jours ouvrés.";

    const memberId = tx(() => {
      const a = get<Record<string, string>>("SELECT * FROM applications WHERE id = ?", app.id)!;
      const t = now();
      const res = run(
        `INSERT INTO members (member_number, application_id, civilite, prenom, nom, email, telephone, ville, pays, offer, card_last4, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        `TMP-${randomCode(10)}`, app.id, a.civilite, a.prenom, a.nom, a.email, a.telephone, a.ville, a.pays, a.offer,
        String(1000 + Math.floor(Math.random() * 9000)), t, t,
      );
      const mid = Number(res.lastInsertRowid);
      run("UPDATE members SET member_number = ? WHERE id = ?", `FD-${100000 + mid}`, mid);
      run(
        `UPDATE applications SET status = 'validee', public_message = ?, member_id = ?, decided_at = ?, updated_at = ?,
           assigned_to = COALESCE(assigned_to, ?) WHERE id = ?`,
        message, mid, t, t, admin.id, app.id,
      );
      return mid;
    });

    await logEvent({ entityType: "application", entityId: app.id, actorType: "admin", actorId: admin.id, action: "demande_validee", detail: message, public: true });
    await logEvent({ entityType: "member", entityId: memberId, actorType: "admin", actorId: admin.id, action: "membre_cree", detail: app.reference });
    touchApps(app.id);
    revalidatePath("/admin/membres");
  });
}

export async function refuseApplication(fd: FormData) {
  await act(appPath(fd), "Demande refusée.", async () => {
    const admin = await requireAdmin();
    const app = loadApp(int(fd, "id"));
    assertFrom(app, ["nouvelle", "en_etude", "complement"]);
    const reason = str(fd, "reason");
    if (!reason) throw new UserError("Le motif interne est obligatoire.");
    const message =
      str(fd, "message") ||
      "Après examen attentif, nous ne sommes pas en mesure de donner une suite favorable à votre demande. Nous vous remercions de l'intérêt porté à Feder.";
    const t = now();
    run(
      `UPDATE applications SET status = 'refusee', decision_reason = ?, public_message = ?, decided_at = ?, updated_at = ?,
         assigned_to = COALESCE(assigned_to, ?) WHERE id = ?`,
      reason, message, t, t, admin.id, app.id,
    );
    await logEvent({ entityType: "application", entityId: app.id, actorType: "admin", actorId: admin.id, action: "demande_refusee", detail: `Motif interne : ${reason}` });
    await logEvent({ entityType: "application", entityId: app.id, actorType: "admin", actorId: admin.id, action: "statut_modifie", detail: message, public: true });
    touchApps(app.id);
  });
}

export async function reopenApplication(fd: FormData) {
  await act(appPath(fd), "Dossier rouvert.", async () => {
    const admin = await requireAdmin("super_admin");
    const app = loadApp(int(fd, "id"));
    assertFrom(app, ["refusee"]);
    run("UPDATE applications SET status = 'en_etude', public_message = NULL, decided_at = NULL, updated_at = ? WHERE id = ?", now(), app.id);
    await logEvent({
      entityType: "application", entityId: app.id, actorType: "admin", actorId: admin.id,
      action: "statut_modifie", detail: "Dossier rouvert pour réexamen", public: true,
    });
    touchApps(app.id);
  });
}

export async function addNote(fd: FormData) {
  const entityType = str(fd, "entityType");
  const path = entityType === "member" ? `/admin/membres/${Number(fd.get("entityId")) || ""}` : `/admin/demandes/${Number(fd.get("entityId")) || ""}`;
  await act(path, "Note ajoutée.", async () => {
    const admin = await requireAdmin();
    if (entityType !== "application" && entityType !== "member") throw new UserError("Type invalide.");
    const entityId = int(fd, "entityId");
    const body = str(fd, "body", 4000);
    if (!body) throw new UserError("La note est vide.");
    run("INSERT INTO notes (entity_type, entity_id, admin_id, body, created_at) VALUES (?, ?, ?, ?, ?)", entityType, entityId, admin.id, body, now());
    await logEvent({ entityType, entityId, actorType: "admin", actorId: admin.id, action: "note_ajoutee" });
    revalidatePath(path);
  });
}

/* ───────────────────────── Members ───────────────────────── */

type MemberRow = { id: number; status: keyof typeof memberStatus; card_status: keyof typeof cardStatus; offer: keyof typeof offerLabel };

function loadMember(id: number) {
  const m = get<MemberRow>("SELECT id, status, card_status, offer FROM members WHERE id = ?", id);
  if (!m) throw new UserError("Membre introuvable.");
  return m;
}

const memberPath = (fd: FormData) => `/admin/membres/${Number(fd.get("id")) || ""}`;

function touchMember(id: number) {
  revalidatePath("/admin");
  revalidatePath("/admin/membres");
  revalidatePath(`/admin/membres/${id}`);
}

export async function updateMemberStatus(fd: FormData) {
  await act(memberPath(fd), "Statut du compte mis à jour.", async () => {
    const admin = await requireAdmin();
    const m = loadMember(int(fd, "id"));
    const status = str(fd, "status") as MemberRow["status"];
    if (!(status in memberStatus)) throw new UserError("Statut invalide.");
    if (status === m.status) throw new UserError("Le compte a déjà ce statut.");
    if (status === "cloture" && admin.role !== "super_admin") throw new UserError("Seul un super admin peut clôturer un compte.");
    if (m.status === "cloture" && admin.role !== "super_admin") throw new UserError("Seul un super admin peut rouvrir un compte clôturé.");
    const reason = str(fd, "reason", 500);
    if (status !== "actif" && !reason) throw new UserError("Le motif est obligatoire.");
    tx(() => {
      run("UPDATE members SET status = ?, updated_at = ? WHERE id = ?", status, now(), m.id);
      // A suspended or closed account can't keep a usable card.
      if (status !== "actif" && ["active", "expediee", "en_fabrication"].includes(m.card_status)) {
        run("UPDATE members SET card_status = ? WHERE id = ?", status === "cloture" ? "opposee" : "gelee", m.id);
      }
    });
    await logEvent({
      entityType: "member", entityId: m.id, actorType: "admin", actorId: admin.id, action: "membre_modifie",
      detail: `${memberStatus[m.status].label} → ${memberStatus[status].label}${reason ? ` · ${reason}` : ""}`,
    });
    touchMember(m.id);
  });
}

export async function updateCardStatus(fd: FormData) {
  await act(memberPath(fd), "Statut de la carte mis à jour.", async () => {
    const admin = await requireAdmin();
    const m = loadMember(int(fd, "id"));
    const status = str(fd, "cardStatus") as MemberRow["card_status"];
    if (!(status in cardStatus)) throw new UserError("Statut de carte invalide.");
    if (status === m.card_status) throw new UserError("La carte a déjà ce statut.");
    if (m.card_status === "opposee") throw new UserError("Une carte en opposition est définitive : émettez une nouvelle carte.");
    if (status === "active" && m.status !== "actif") throw new UserError("Réactivez d'abord le compte du membre.");
    run("UPDATE members SET card_status = ?, updated_at = ? WHERE id = ?", status, now(), m.id);
    await logEvent({
      entityType: "member", entityId: m.id, actorType: "admin", actorId: admin.id, action: "carte_modifiee",
      detail: `${cardStatus[m.card_status].label} → ${cardStatus[status].label}`,
    });
    touchMember(m.id);
  });
}

export async function reissueCard(fd: FormData) {
  await act(memberPath(fd), "Nouvelle carte commandée.", async () => {
    const admin = await requireAdmin();
    const m = loadMember(int(fd, "id"));
    if (m.status !== "actif") throw new UserError("Le compte doit être actif pour émettre une nouvelle carte.");
    const last4 = String(1000 + Math.floor(Math.random() * 9000));
    run("UPDATE members SET card_status = 'en_fabrication', card_last4 = ?, updated_at = ? WHERE id = ?", last4, now(), m.id);
    await logEvent({ entityType: "member", entityId: m.id, actorType: "admin", actorId: admin.id, action: "carte_modifiee", detail: `Nouvelle carte •••• ${last4}` });
    touchMember(m.id);
  });
}

export async function updateMemberOffer(fd: FormData) {
  await act(memberPath(fd), "Offre mise à jour.", async () => {
    const admin = await requireAdmin();
    const m = loadMember(int(fd, "id"));
    const offer = str(fd, "offer") as MemberRow["offer"];
    if (!(offer in offerLabel)) throw new UserError("Offre invalide.");
    if (offer === m.offer) throw new UserError("Le membre a déjà cette offre.");
    run("UPDATE members SET offer = ?, updated_at = ? WHERE id = ?", offer, now(), m.id);
    await logEvent({
      entityType: "member", entityId: m.id, actorType: "admin", actorId: admin.id, action: "offre_modifiee",
      detail: `${offerLabel[m.offer]} → ${offerLabel[offer]}`,
    });
    touchMember(m.id);
  });
}

export async function updateMemberContact(fd: FormData) {
  await act(memberPath(fd), "Coordonnées mises à jour.", async () => {
    const admin = await requireAdmin();
    const m = loadMember(int(fd, "id"));
    const email = str(fd, "email", 160);
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new UserError("E-mail invalide.");
    run(
      "UPDATE members SET email = ?, telephone = ?, ville = ?, pays = ?, updated_at = ? WHERE id = ?",
      email, str(fd, "telephone", 40), str(fd, "ville", 100), str(fd, "pays", 80), now(), m.id,
    );
    await logEvent({ entityType: "member", entityId: m.id, actorType: "admin", actorId: admin.id, action: "membre_modifie", detail: "Coordonnées mises à jour" });
    touchMember(m.id);
  });
}

/* ───────────────────────── Team (super admin) ───────────────────────── */

export async function createAdminAction(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin("super_admin");
  const email = str(fd, "email", 160).toLowerCase();
  const name = str(fd, "name", 80);
  const role = str(fd, "role");
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) return { error: "Nom et e-mail valides requis." };
  if (role !== "super_admin" && role !== "analyste") return { error: "Rôle invalide." };
  if (get("SELECT 1 FROM admins WHERE email = ?", email)) return { error: "Un compte existe déjà avec cet e-mail." };

  const pwd = tempPassword();
  const res = run(
    "INSERT INTO admins (email, name, role, password_hash, must_change_password, created_at) VALUES (?, ?, ?, ?, 1, ?)",
    email, name, role, hashPassword(pwd), now(),
  );
  await logEvent({ entityType: "admin", entityId: Number(res.lastInsertRowid), actorType: "admin", actorId: admin.id, action: "admin_cree", detail: `${name} · ${role}` });
  revalidatePath("/admin/equipe");
  return { ok: `Compte créé pour ${name}. Transmettez-lui ce mot de passe provisoire, affiché une seule fois :`, secret: pwd };
}

export async function resetAdminPassword(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin("super_admin");
  const id = Number(fd.get("id"));
  const target = get<{ name: string }>("SELECT name FROM admins WHERE id = ?", id);
  if (!target) return { error: "Compte introuvable." };
  if (id === admin.id) return { error: "Utilisez « Mon compte » pour changer votre propre mot de passe." };
  const pwd = tempPassword();
  tx(() => {
    run("UPDATE admins SET password_hash = ?, must_change_password = 1 WHERE id = ?", hashPassword(pwd), id);
    run("DELETE FROM sessions WHERE admin_id = ?", id);
  });
  await logEvent({ entityType: "admin", entityId: id, actorType: "admin", actorId: admin.id, action: "mot_de_passe_reinitialise", detail: target.name });
  return { ok: `Mot de passe provisoire pour ${target.name}, affiché une seule fois :`, secret: pwd };
}

export async function updateAdmin(fd: FormData) {
  await act("/admin/equipe", "Compte mis à jour.", async () => {
    const admin = await requireAdmin("super_admin");
    const id = int(fd, "id");
    if (id === admin.id) throw new UserError("Vous ne pouvez pas modifier votre propre rôle ou statut.");
    const role = str(fd, "role");
    const active = fd.get("active") === "1" ? 1 : 0;
    if (role !== "super_admin" && role !== "analyste") throw new UserError("Rôle invalide.");
    tx(() => {
      run("UPDATE admins SET role = ?, active = ? WHERE id = ?", role, active, id);
      if (!active) run("DELETE FROM sessions WHERE admin_id = ?", id);
    });
    await logEvent({ entityType: "admin", entityId: id, actorType: "admin", actorId: admin.id, action: "admin_modifie", detail: `${role} · ${active ? "actif" : "désactivé"}` });
    revalidatePath("/admin/equipe");
  });
}

/* ───────────────────────── Settings (super admin) ───────────────────────── */

export async function saveSettings(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin("super_admin");
  const num = (k: string, min: number, max: number, fallback: number) => {
    const n = Number(fd.get(k));
    return String(Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : fallback);
  };
  const values: Record<string, string> = {
    admissions_open: fd.get("admissions_open") === "1" ? "1" : "0",
    closed_message: str(fd, "closed_message", 400) || "Les admissions sont momentanément suspendues.",
    sla_hours: num("sla_hours", 1, 720, 48),
    fee_gold: num("fee_gold", 0, 100000, 19),
    fee_platine: num("fee_platine", 0, 100000, 49),
    fee_noire: num("fee_noire", 0, 100000, 150),
  };
  const before = getSettings();
  tx(() => {
    for (const [k, v] of Object.entries(values)) run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", k, v);
  });
  const changed = Object.keys(values).filter((k) => before[k] !== values[k]);
  if (changed.length) {
    await logEvent({ entityType: "settings", actorType: "admin", actorId: admin.id, action: "parametres_modifies", detail: changed.join(", ") });
  }
  revalidatePath("/admin", "layout");
  revalidatePath("/admission");
  return { ok: "Paramètres enregistrés." };
}
