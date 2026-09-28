import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { randomToken, sha256 } from "./crypto";
import { get, now, run } from "./db";

const COOKIE = "feder_admin";
const SESSION_HOURS = 8;

export type Role = "super_admin" | "analyste";
export type Admin = {
  id: number;
  email: string;
  name: string;
  role: Role;
  must_change_password: number;
};

export async function createSession(adminId: number, ip: string) {
  const token = randomToken();
  const expires = new Date(Date.now() + SESSION_HOURS * 3600_000);
  const ua = (await headers()).get("user-agent") ?? "";
  run(
    "INSERT INTO sessions (token_hash, admin_id, created_at, expires_at, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)",
    sha256(token),
    adminId,
    now(),
    expires.toISOString(),
    ip,
    ua.slice(0, 300),
  );
  run("DELETE FROM sessions WHERE expires_at < ?", now());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) run("DELETE FROM sessions WHERE token_hash = ?", sha256(token));
  jar.delete(COOKIE);
}

/** Current admin (once per request), or null. */
export const getAdmin = cache(async (): Promise<Admin | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const admin = get<Admin>(
    `SELECT a.id, a.email, a.name, a.role, a.must_change_password
       FROM sessions s JOIN admins a ON a.id = s.admin_id
      WHERE s.token_hash = ? AND s.expires_at > ? AND a.active = 1`,
    sha256(token),
    now(),
  );
  return admin ?? null;
});

/**
 * Gate for every admin page, action and route handler.
 * Layout checks alone are not enough: server actions can be called directly.
 */
export async function requireAdmin(role?: Role, opts: { allowPasswordChange?: boolean } = {}): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/connexion");
  if (admin.must_change_password && !opts.allowPasswordChange) redirect("/admin/compte?premiere=1");
  if (role === "super_admin" && admin.role !== "super_admin") redirect("/admin?erreur=acces");
  return admin;
}
