"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { offerRules } from "@/lib/banking-labels";
import { clientIp, logEvent } from "@/lib/server/audit";
import {
  BankError,
  cardDetails,
  closeVault,
  externalTransfer,
  federPay,
  findRecipient,
  isValidIban,
  normalizeIban,
  vaultMove,
} from "@/lib/server/banking";
import { hashPassword, sha256, verifyPassword } from "@/lib/server/crypto";
import { get, now, run, tx } from "@/lib/server/db";
import {
  createMemberSession,
  destroyMemberSession,
  getMemberSession,
  hasFreshReauth,
  memberForActivation,
  readTotpSecret,
  requireMember,
  storeTotpSecret,
  type Member,
} from "@/lib/server/member-auth";
import { hit, isBlocked, reset } from "@/lib/server/rate-limit";
import { newTotpSecret, otpauthUri, verifyTotp } from "@/lib/server/totp";

export type State = { error?: string; ok?: string; data?: { needCode?: boolean; [k: string]: unknown } } | undefined;

const str = (fd: FormData, k: string, max = 500) => String(fd.get(k) ?? "").trim().slice(0, max);

/** "1 250,50" → 125050 cents. */
function parseAmount(v: string) {
  const n = Number(v.replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

function passwordProblem(p: string) {
  if (p.length < 12) return "12 caractères minimum.";
  if (!/[a-z]/.test(p) || !/[A-Z]/.test(p) || !/\d/.test(p)) return "Au moins une minuscule, une majuscule et un chiffre.";
  return null;
}

function newRecoveryCodes() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = () => Array.from({ length: 4 }, () => alphabet[randomInt(alphabet.length)]).join("");
  return Array.from({ length: 8 }, () => `${part()}-${part()}`);
}

const memberLog = (m: { id: number }, action: string, detail?: string) =>
  logEvent({ entityType: "member", entityId: m.id, actorType: "membre", actorId: m.id, action, detail });

/** Checks a 6-digit code (or a single-use recovery code) for a member. */
function checkSecondFactor(memberId: number, code: string) {
  const row = get<{ totp_secret: string | null; recovery_codes: string | null }>(
    "SELECT totp_secret, recovery_codes FROM members WHERE id = ?",
    memberId,
  );
  if (!row?.totp_secret) return false;
  if (verifyTotp(readTotpSecret(row.totp_secret), code)) return true;
  const normalized = code.trim().toUpperCase();
  if (/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalized) && row.recovery_codes) {
    const hashes = JSON.parse(row.recovery_codes) as string[];
    const h = sha256(normalized);
    if (hashes.includes(h)) {
      run("UPDATE members SET recovery_codes = ? WHERE id = ?", JSON.stringify(hashes.filter((x) => x !== h)), memberId);
      return true;
    }
  }
  return false;
}

/** Step-up for sensitive actions: a fresh code within the last 5 minutes, or one supplied in the form. */
async function stepUp(m: Member, fd: FormData): Promise<string | null> {
  if (hasFreshReauth(m)) return null;
  const code = str(fd, "code", 20);
  const key = `stepup:${m.id}`;
  if (isBlocked(key, 5, 15 * 60_000)) return "Trop de codes erronés. Réessayez dans 15 minutes.";
  if (!code) return "Code de sécurité requis.";
  if (!checkSecondFactor(m.id, code)) {
    hit(key, 5, 15 * 60_000);
    await memberLog(m, "membre_2fa_echouee");
    return "Code de sécurité incorrect.";
  }
  reset(key);
  run("UPDATE member_sessions SET reauth_at = ? WHERE token_hash = ?", now(), m.token_hash);
  return null;
}

/* ───────────────────────── Activation ───────────────────────── */

export async function activationPassword(_: State, fd: FormData): Promise<State> {
  const token = str(fd, "token", 200);
  const m = memberForActivation(token);
  if (!m) return { error: "Ce lien d'activation n'est plus valide. Demandez-en un nouveau." };
  const pwd = String(fd.get("password") ?? "");
  const problem = passwordProblem(pwd);
  if (problem) return { error: problem };
  if (pwd !== fd.get("confirm")) return { error: "Les deux mots de passe ne correspondent pas." };

  const secret = newTotpSecret();
  run(
    "UPDATE members SET password_hash = ?, totp_secret = ?, totp_enabled = 0, activated_at = NULL WHERE id = ?",
    hashPassword(pwd), storeTotpSecret(secret), m.id,
  );
  const uri = otpauthUri(secret, m.member_number);
  const qr = await QRCode.toString(uri, { type: "svg", margin: 1, color: { dark: "#0b0b0c", light: "#ffffff" } });
  return { ok: "password", data: { qr, secret: secret.replace(/(.{4})/g, "$1 ").trim() } };
}

export async function activationTotp(_: State, fd: FormData): Promise<State> {
  const token = str(fd, "token", 200);
  const m = memberForActivation(token);
  if (!m || !m.totp_secret) return { error: "Ce lien d'activation n'est plus valide." };
  const key = `activation:${m.id}`;
  if (isBlocked(key, 8, 15 * 60_000)) return { error: "Trop d'essais. Réessayez dans 15 minutes." };
  if (!verifyTotp(readTotpSecret(m.totp_secret), str(fd, "code", 10))) {
    hit(key, 8, 15 * 60_000);
    return { error: "Code incorrect. Vérifiez l'heure de votre téléphone et réessayez." };
  }
  reset(key);
  const codes = newRecoveryCodes();
  run(
    `UPDATE members SET totp_enabled = 1, activated_at = ?, activation_token_hash = NULL, activation_expires_at = NULL,
       recovery_codes = ? WHERE id = ?`,
    now(), JSON.stringify(codes.map(sha256)), m.id,
  );
  run("DELETE FROM member_sessions WHERE member_id = ?", m.id);
  await logEvent({ entityType: "member", entityId: m.id, actorType: "membre", actorId: m.id, action: "espace_active" });
  // No session is opened here on purpose: setting a cookie would refresh the page (now with a
  // consumed token) before the recovery codes are shown. The member signs in right after.
  return { ok: "done", data: { codes } };
}

/* ───────────────────────── Login ───────────────────────── */

let dummy: string | undefined;

export async function memberLogin(_: State, fd: FormData): Promise<State> {
  const id = str(fd, "identifiant", 160);
  const pwd = String(fd.get("password") ?? "");
  const ip = await clientIp();
  const key = `mlogin:${id.toLowerCase()}:${ip}`;
  if (isBlocked(key, 5, 15 * 60_000)) return { error: "Trop de tentatives. Réessayez dans 15 minutes." };

  const m = get<{ id: number; password_hash: string | null; activated_at: string | null; status: string }>(
    "SELECT id, password_hash, activated_at, status FROM members WHERE email = ? OR member_number = ?",
    id, id.toUpperCase(),
  );
  dummy ??= hashPassword("dummy-password-for-timing");
  const ok = verifyPassword(pwd, m?.password_hash ?? dummy);
  if (!m || !ok || !m.activated_at || m.status === "cloture") {
    hit(key, 5, 15 * 60_000);
    if (m) await logEvent({ entityType: "member", entityId: m.id, actorType: "systeme", action: "membre_connexion_echouee" });
    return { error: "Identifiant ou mot de passe incorrect." };
  }
  reset(key);
  await createMemberSession(m.id, ip, false);
  redirect("/espace/verification");
}

export async function memberVerify(_: State, fd: FormData): Promise<State> {
  const s = await getMemberSession();
  if (!s) redirect("/espace/connexion");
  const key = `mverify:${s.id}`;
  if (isBlocked(key, 5, 15 * 60_000)) {
    await destroyMemberSession();
    return { error: "Trop de codes erronés. Reconnectez-vous dans 15 minutes." };
  }
  if (!checkSecondFactor(s.id, str(fd, "code", 20))) {
    hit(key, 5, 15 * 60_000);
    await memberLog(s, "membre_2fa_echouee");
    return { error: "Code incorrect." };
  }
  reset(key);
  run(
    "UPDATE member_sessions SET mfa_ok = 1, reauth_at = ?, expires_at = ? WHERE token_hash = ?",
    now(), new Date(Date.now() + 30 * 60_000).toISOString(), s.token_hash,
  );
  run("UPDATE members SET last_login_at = ? WHERE id = ?", now(), s.id);
  await memberLog(s, "membre_connexion");
  redirect("/espace");
}

export async function memberLogout() {
  await destroyMemberSession();
  redirect("/espace/connexion?au-revoir=1");
}

export async function reauthAction(_: State, fd: FormData): Promise<State> {
  const m = await requireMember();
  const err = await stepUp(m, fd);
  return err ? { error: err } : { ok: "Identité confirmée." };
}

/* ───────────────────────── Money ───────────────────────── */

export async function lookupRecipient(numero: string) {
  const m = await requireMember();
  if (!hit(`lookup:${m.id}`, 30, 60_000)) return null;
  const r = findRecipient(numero);
  if (!r || r.status !== "actif" || r.id === m.id) return null;
  return { name: `${r.prenom} ${r.nom.charAt(0)}.`, number: r.member_number };
}

export async function federPayAction(_: State, fd: FormData): Promise<State> {
  const m = await requireMember();
  const amount = parseAmount(str(fd, "amount", 20));
  if (!amount) return { error: "Montant invalide." };
  if (amount > 50_000_00) return { error: "Feder Pay est limité à 50 000 € par envoi." };
  if (amount > 500_00) {
    const err = await stepUp(m, fd);
    if (err) return { error: err, data: { needCode: true } };
  }
  try {
    const to = federPay(m.id, str(fd, "numero", 20), amount, str(fd, "note", 140));
    await memberLog(m, "feder_pay", `${(amount / 100).toFixed(2)} € → ${to.member_number}`);
  } catch (e) {
    if (e instanceof BankError) return { error: e.message };
    throw e;
  }
  revalidatePath("/espace", "layout");
  return { ok: "sent", data: { amount } };
}

export async function addBeneficiary(_: State, fd: FormData): Promise<State> {
  const m = await requireMember();
  const name = str(fd, "name", 80);
  const iban = normalizeIban(str(fd, "iban", 50));
  if (!name) return { error: "Nom du bénéficiaire requis." };
  if (!isValidIban(iban)) return { error: "IBAN invalide. Vérifiez chaque caractère." };
  const err = await stepUp(m, fd);
  if (err) return { error: err, data: { needCode: true } };
  if (get("SELECT 1 FROM beneficiaries WHERE member_id = ? AND iban = ?", m.id, iban)) return { error: "Ce bénéficiaire existe déjà." };
  run("INSERT INTO beneficiaries (member_id, name, iban, created_at) VALUES (?, ?, ?, ?)", m.id, name, iban, now());
  await memberLog(m, "beneficiaire_ajoute", `${name} · ${iban.slice(0, 4)}…${iban.slice(-4)}`);
  revalidatePath("/espace/virements");
  return { ok: "Bénéficiaire ajouté." };
}

export async function deleteBeneficiary(fd: FormData) {
  const m = await requireMember();
  run("DELETE FROM beneficiaries WHERE id = ? AND member_id = ?", Number(fd.get("id")), m.id);
  revalidatePath("/espace/virements");
}

export async function transferAction(_: State, fd: FormData): Promise<State> {
  const m = await requireMember();
  const amount = parseAmount(str(fd, "amount", 20));
  if (!amount) return { error: "Montant invalide." };
  const err = await stepUp(m, fd);
  if (err) return { error: err, data: { needCode: true } };
  try {
    const b = externalTransfer(m.id, Number(fd.get("beneficiary")), amount, str(fd, "label", 140));
    await memberLog(m, "virement_emis", `${(amount / 100).toFixed(2)} € → ${b.name}`);
  } catch (e) {
    if (e instanceof BankError) return { error: e.message };
    throw e;
  }
  revalidatePath("/espace", "layout");
  return { ok: "sent", data: { amount } };
}

/* ───────────────────────── Vaults ───────────────────────── */

export async function createVault(_: State, fd: FormData): Promise<State> {
  const m = await requireMember();
  const name = str(fd, "name", 40);
  const target = parseAmount(str(fd, "target", 20));
  const icon = str(fd, "icon", 20) || "star";
  if (!name || !target) return { error: "Nom et objectif requis." };
  const count = get<{ n: number }>("SELECT COUNT(*) n FROM vaults WHERE member_id = ? AND closed_at IS NULL", m.id)!.n;
  if (count >= 12) return { error: "12 coffres maximum." };
  run("INSERT INTO vaults (member_id, name, icon, target_cents, created_at) VALUES (?, ?, ?, ?, ?)", m.id, name, icon, target, now());
  revalidatePath("/espace", "layout");
  return { ok: "Coffre créé." };
}

export async function vaultMoveAction(_: State, fd: FormData): Promise<State> {
  const m = await requireMember();
  const amount = parseAmount(str(fd, "amount", 20));
  if (!amount) return { error: "Montant invalide." };
  const dir = fd.get("direction") === "out" ? "out" : "in";
  try {
    vaultMove(m.id, Number(fd.get("vault")), amount, dir);
  } catch (e) {
    if (e instanceof BankError) return { error: e.message };
    throw e;
  }
  revalidatePath("/espace", "layout");
  return { ok: dir === "in" ? "Mis de côté." : "Récupéré sur votre compte." };
}

export async function closeVaultAction(fd: FormData) {
  const m = await requireMember();
  try {
    closeVault(m.id, Number(fd.get("vault")));
  } catch (e) {
    if (!(e instanceof BankError)) throw e;
  }
  revalidatePath("/espace", "layout");
}

/* ───────────────────────── Card ───────────────────────── */

export async function toggleFreeze() {
  const m = await requireMember();
  const card = get<{ card_status: string; status: string }>("SELECT card_status, status FROM members WHERE id = ?", m.id)!;
  if (card.card_status === "active") {
    run("UPDATE members SET card_status = 'gelee', updated_at = ? WHERE id = ?", now(), m.id);
    await memberLog(m, "carte_gelee");
  } else if (card.card_status === "gelee" && card.status === "actif") {
    run("UPDATE members SET card_status = 'active', updated_at = ? WHERE id = ?", now(), m.id);
    await memberLog(m, "carte_degelee");
  }
  revalidatePath("/espace", "layout");
}

export async function cardSettings(_: State, fd: FormData): Promise<State> {
  const m = await requireMember();
  const rules = offerRules[m.offer];
  const pay = Math.min(rules.maxPayment, Math.max(100_00, Math.round(Number(fd.get("limit_payment")) * 100) || rules.maxPayment));
  const wd = Math.min(rules.maxWithdrawal, Math.max(50_00, Math.round(Number(fd.get("limit_withdrawal")) * 100) || rules.maxWithdrawal));
  run(
    `UPDATE members SET card_online = ?, card_contactless = ?, card_abroad = ?, limit_payment_cents = ?, limit_withdrawal_cents = ?, updated_at = ?
      WHERE id = ?`,
    fd.get("online") === "1" ? 1 : 0, fd.get("contactless") === "1" ? 1 : 0, fd.get("abroad") === "1" ? 1 : 0, pay, wd, now(), m.id,
  );
  await memberLog(m, "carte_reglages");
  revalidatePath("/espace/carte");
  return { ok: "Réglages enregistrés." };
}

export async function revealCard(_: State, fd: FormData): Promise<State> {
  const m = await requireMember();
  const err = await stepUp(m, fd);
  if (err) return { error: err, data: { needCode: true } };
  const row = get<{ card_last4: string; updated_at: string; created_at: string }>("SELECT card_last4, updated_at, created_at FROM members WHERE id = ?", m.id)!;
  await memberLog(m, "carte_details");
  return { ok: "revealed", data: cardDetails(m.id, row.card_last4, row.created_at) };
}

export async function declareOpposition(_: State, fd: FormData): Promise<State> {
  const m = await requireMember();
  const err = await stepUp(m, fd);
  if (err) return { error: err, data: { needCode: true } };
  const reason = str(fd, "reason", 40) || "perte";
  const last4 = String(1000 + randomInt(9000));
  tx(() => {
    run("UPDATE members SET card_status = 'en_fabrication', card_last4 = ?, updated_at = ? WHERE id = ?", last4, now(), m.id);
  });
  await memberLog(m, "carte_opposition", `Motif : ${reason} · nouvelle carte •••• ${last4}`);
  revalidatePath("/espace", "layout");
  return { ok: "Opposition enregistrée. Votre nouvelle carte est en fabrication." };
}

export async function createVirtualCard(_: State, fd: FormData): Promise<State> {
  const m = await requireMember();
  const label = str(fd, "label", 40) || "Carte virtuelle";
  const n = get<{ n: number }>("SELECT COUNT(*) n FROM virtual_cards WHERE member_id = ? AND status = 'active'", m.id)!.n;
  if (n >= 10) return { error: "10 cartes virtuelles actives maximum." };
  run(
    "INSERT INTO virtual_cards (member_id, label, last4, single_use, created_at) VALUES (?, ?, ?, ?, ?)",
    m.id, label, String(1000 + randomInt(9000)), fd.get("single_use") === "1" ? 1 : 0, now(),
  );
  await memberLog(m, "carte_virtuelle", label);
  revalidatePath("/espace/carte");
  return { ok: "Carte virtuelle créée." };
}

export async function deleteVirtualCard(fd: FormData) {
  const m = await requireMember();
  run("UPDATE virtual_cards SET status = 'supprimee' WHERE id = ? AND member_id = ?", Number(fd.get("id")), m.id);
  revalidatePath("/espace/carte");
}

/* ───────────────────────── Concierge & privileges ───────────────────────── */

export async function sendConciergeMessage(_: State, fd: FormData): Promise<State> {
  const m = await requireMember();
  const body = str(fd, "body", 2000);
  if (!body) return { error: "Message vide." };
  if (!hit(`concierge:${m.id}`, 20, 10 * 60_000)) return { error: "Doucement : quelques instants avant le prochain message." };
  run("INSERT INTO concierge_messages (member_id, sender, body, created_at) VALUES (?, 'member', ?, ?)", m.id, body, now());
  revalidatePath("/espace/conciergerie");
  revalidatePath("/admin/conciergerie");
  return { ok: "sent" };
}

export async function toggleRsvp(fd: FormData) {
  const m = await requireMember();
  const key = str(fd, "event", 60);
  const guests = Math.max(0, Math.min(m.offer === "noire" ? 2 : 1, Number(fd.get("guests")) || 0));
  if (get("SELECT 1 FROM event_rsvps WHERE member_id = ? AND event_key = ?", m.id, key)) {
    run("DELETE FROM event_rsvps WHERE member_id = ? AND event_key = ?", m.id, key);
  } else {
    run("INSERT INTO event_rsvps (member_id, event_key, guests, created_at) VALUES (?, ?, ?, ?)", m.id, key, guests, now());
  }
  revalidatePath("/espace/privileges");
}

/* ───────────────────────── Security ───────────────────────── */

export async function memberChangePassword(_: State, fd: FormData): Promise<State> {
  const m = await requireMember();
  const row = get<{ password_hash: string }>("SELECT password_hash FROM members WHERE id = ?", m.id)!;
  if (!verifyPassword(String(fd.get("current") ?? ""), row.password_hash)) return { error: "Mot de passe actuel incorrect." };
  const next = String(fd.get("next") ?? "");
  const problem = passwordProblem(next);
  if (problem) return { error: problem };
  if (next !== fd.get("confirm")) return { error: "Les deux mots de passe ne correspondent pas." };
  run("UPDATE members SET password_hash = ? WHERE id = ?", hashPassword(next), m.id);
  run("DELETE FROM member_sessions WHERE member_id = ? AND token_hash != ?", m.id, m.token_hash);
  await memberLog(m, "mot_de_passe_membre");
  return { ok: "Mot de passe mis à jour. Vos autres appareils ont été déconnectés." };
}

export async function revokeOtherSessions() {
  const m = await requireMember();
  run("DELETE FROM member_sessions WHERE member_id = ? AND token_hash != ?", m.id, m.token_hash);
  await memberLog(m, "sessions_revoquees");
  revalidatePath("/espace/securite");
}

export async function regenerateRecoveryCodes(_: State, fd: FormData): Promise<State> {
  const m = await requireMember();
  const err = await stepUp(m, fd);
  if (err) return { error: err, data: { needCode: true } };
  const codes = newRecoveryCodes();
  run("UPDATE members SET recovery_codes = ? WHERE id = ?", JSON.stringify(codes.map(sha256)), m.id);
  await memberLog(m, "codes_secours");
  return { ok: "codes", data: { codes } };
}
