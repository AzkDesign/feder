import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { decrypt, encrypt, randomToken, sha256 } from "./crypto";
import { get, now, run } from "./db";

const COOKIE = "feder_membre";
const SESSION_MIN = 30; // idle timeout, like a banking app
const PENDING_MIN = 10; // time allowed to enter the 2FA code

export type Member = {
  id: number;
  member_number: string;
  prenom: string;
  nom: string;
  email: string;
  offer: "gold" | "platine" | "noire";
  status: string;
  card_status: string;
  card_last4: string;
  totp_enabled: number;
  mfa_ok: number;
  reauth_at: string | null;
  token_hash: string;
};

export async function createMemberSession(memberId: number, ip: string, mfaOk: boolean) {
  const token = randomToken();
  const expires = new Date(Date.now() + (mfaOk ? SESSION_MIN : PENDING_MIN) * 60_000);
  const ua = (await headers()).get("user-agent") ?? "";
  run(
    `INSERT INTO member_sessions (token_hash, member_id, mfa_ok, created_at, expires_at, last_seen_at, ip, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    sha256(token), memberId, mfaOk ? 1 : 0, now(), expires.toISOString(), now(), ip, ua.slice(0, 300),
  );
  run("DELETE FROM member_sessions WHERE expires_at < ?", now());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
}

export async function destroyMemberSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) run("DELETE FROM member_sessions WHERE token_hash = ?", sha256(token));
  jar.delete(COOKIE);
}

/** Session (possibly still waiting for its 2FA code). Sliding expiry on each request. */
export const getMemberSession = cache(async (): Promise<Member | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const hash = sha256(token);
  const m = get<Member>(
    `SELECT m.id, m.member_number, m.prenom, m.nom, m.email, m.offer, m.status, m.card_status, m.card_last4, m.totp_enabled,
            s.mfa_ok, s.reauth_at, s.token_hash
       FROM member_sessions s JOIN members m ON m.id = s.member_id
      WHERE s.token_hash = ? AND s.expires_at > ? AND m.status != 'cloture' AND m.activated_at IS NOT NULL`,
    hash,
    now(),
  );
  if (!m) return null;
  if (m.mfa_ok) {
    run(
      "UPDATE member_sessions SET expires_at = ?, last_seen_at = ? WHERE token_hash = ?",
      new Date(Date.now() + SESSION_MIN * 60_000).toISOString(),
      now(),
      hash,
    );
  }
  return m;
});

/** Gate for every member page, action and API route. */
export async function requireMember(): Promise<Member> {
  const m = await getMemberSession();
  if (!m) redirect("/espace/connexion");
  if (!m.mfa_ok) redirect("/espace/verification");
  return m;
}

/** Sensitive operations need a fresh 2FA code (within the last 5 minutes). */
export function hasFreshReauth(m: Member) {
  return !!m.reauth_at && Date.now() - new Date(m.reauth_at).getTime() < 5 * 60_000;
}

const ACTIVATION_HOURS = 72;

/**
 * New single-use activation link token. Only its hash is stored; issuing a new one
 * invalidates the previous. Works for first activation and for access resets.
 */
export function issueActivationToken(memberId: number) {
  const token = randomToken();
  run(
    "UPDATE members SET activation_token_hash = ?, activation_expires_at = ? WHERE id = ?",
    sha256(token),
    new Date(Date.now() + ACTIVATION_HOURS * 3600_000).toISOString(),
    memberId,
  );
  return token;
}

export function memberForActivation(token: string) {
  if (!token) return null;
  return get<{ id: number; prenom: string; email: string; member_number: string; offer: string; password_hash: string | null; totp_secret: string | null }>(
    `SELECT id, prenom, email, member_number, offer, password_hash, totp_secret FROM members
      WHERE activation_token_hash = ? AND activation_expires_at > ? AND status != 'cloture'`,
    sha256(token),
    now(),
  );
}

export function storeTotpSecret(secret: string) {
  const e = encrypt(Buffer.from(secret));
  return JSON.stringify({ d: e.data.toString("base64"), iv: e.iv, tag: e.tag });
}

export function readTotpSecret(stored: string) {
  const { d, iv, tag } = JSON.parse(stored) as { d: string; iv: string; tag: string };
  return decrypt(Buffer.from(d, "base64"), iv, tag).toString();
}
