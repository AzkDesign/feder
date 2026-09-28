"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "./actions";
import { logEvent } from "@/lib/server/audit";
import { requireAdmin } from "@/lib/server/auth";
import { BankError, cardPayment, deposit } from "@/lib/server/banking";
import { get, now, run, tx } from "@/lib/server/db";
import { issueActivationToken } from "@/lib/server/member-auth";

const back = (id: number, q: string) => redirect(`/admin/membres/${id}?${q}`);

/** Activation link for a member (first access, or full access reset: password + 2FA). Shown once. */
export async function activationLinkAction(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = Number(fd.get("id"));
  const m = get<{ id: number; status: string; activated_at: string | null }>("SELECT id, status, activated_at FROM members WHERE id = ?", id);
  if (!m) return { error: "Membre introuvable." };
  if (m.status === "cloture") return { error: "Compte clôturé." };

  const reset = fd.get("reset") === "1";
  if (m.activated_at && !reset) return { error: "L'espace est déjà activé. Utilisez « Réinitialiser l'accès »." };
  if (reset) {
    tx(() => {
      run("UPDATE members SET password_hash = NULL, totp_secret = NULL, totp_enabled = 0, recovery_codes = NULL, activated_at = NULL WHERE id = ?", id);
      run("DELETE FROM member_sessions WHERE member_id = ?", id);
    });
  }
  const token = issueActivationToken(id);
  await logEvent({ entityType: "member", entityId: id, actorType: "admin", actorId: admin.id, action: "lien_activation", detail: reset ? "Réinitialisation de l'accès" : "Première activation" });
  revalidatePath(`/admin/membres/${id}`);
  return { ok: "Lien valable 72 h, affiché une seule fois. Transmettez-le au membre par un canal sûr :", secret: `/espace/activation?token=${token}` };
}

export async function simulateDeposit(fd: FormData) {
  const admin = await requireAdmin();
  const id = Number(fd.get("id"));
  const amount = Math.round(Number(String(fd.get("amount")).replace(",", ".")) * 100);
  const label = String(fd.get("label") ?? "").trim().slice(0, 80) || "Virement reçu";
  try {
    deposit(id, amount, label);
  } catch (e) {
    if (e instanceof BankError) back(id, `erreur=${encodeURIComponent(e.message)}`);
    throw e;
  }
  await logEvent({ entityType: "member", entityId: id, actorType: "admin", actorId: admin.id, action: "depot_simule", detail: `${(amount / 100).toFixed(2)} € · ${label}` });
  revalidatePath(`/admin/membres/${id}`);
  back(id, `ok=${encodeURIComponent("Versement simulé enregistré.")}`);
}

export async function simulateCard(fd: FormData) {
  const admin = await requireAdmin();
  const id = Number(fd.get("id"));
  const amount = Math.round(Number(String(fd.get("amount")).replace(",", ".")) * 100);
  const merchant = String(fd.get("merchant") ?? "").trim().slice(0, 80) || "Commerçant";
  let res: { ok: boolean; reason?: string };
  try {
    res = cardPayment(id, {
      merchant,
      category: String(fd.get("category") ?? "autre"),
      amount,
      online: fd.get("channel") === "online",
      contactless: fd.get("channel") === "contactless",
      abroad: fd.get("abroad") === "1",
    });
  } catch (e) {
    if (e instanceof BankError) back(id, `erreur=${encodeURIComponent(e.message)}`);
    throw e;
  }
  await logEvent({
    entityType: "member", entityId: id, actorType: "admin", actorId: admin.id, action: "paiement_simule",
    detail: `${merchant} · ${(amount / 100).toFixed(2)} € · ${res.ok ? "accepté" : `refusé (${res.reason})`}`,
  });
  revalidatePath(`/admin/membres/${id}`);
  back(id, res.ok ? `ok=${encodeURIComponent("Paiement accepté.")}` : `erreur=${encodeURIComponent(`Paiement refusé : ${res.reason}`)}`);
}

export async function conciergeReply(fd: FormData) {
  const admin = await requireAdmin();
  const id = Number(fd.get("memberId"));
  const body = String(fd.get("body") ?? "").trim().slice(0, 2000);
  if (!get("SELECT 1 FROM members WHERE id = ?", id)) redirect("/admin/conciergerie");
  if (body) {
    run("INSERT INTO concierge_messages (member_id, sender, admin_id, body, created_at) VALUES (?, 'admin', ?, ?, ?)", id, admin.id, body, now());
    await logEvent({ entityType: "member", entityId: id, actorType: "admin", actorId: admin.id, action: "reponse_conciergerie" });
  }
  revalidatePath("/admin/conciergerie");
  redirect(`/admin/conciergerie/${id}`);
}
