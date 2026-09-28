import { NextResponse } from "next/server";
import { clientIp } from "@/lib/server/audit";
import { get } from "@/lib/server/db";
import { issueActivationToken } from "@/lib/server/member-auth";
import { hit } from "@/lib/server/rate-limit";
import { findForApplicant, publicTimeline } from "@/lib/server/tracking";

export async function POST(req: Request) {
  if (!hit(`suivi:${await clientIp()}`, 20, 15 * 60_000)) {
    return NextResponse.json({ error: "Trop de tentatives. Réessayez dans quelques minutes." }, { status: 429 });
  }
  const { reference, email } = (await req.json().catch(() => ({}))) as { reference?: string; email?: string };
  if (!reference || !email) return NextResponse.json({ error: "Référence et e-mail requis." }, { status: 400 });

  const app = findForApplicant(reference, email);
  // Same message whether the reference or the e-mail is wrong: don't leak which one exists.
  if (!app) return NextResponse.json({ error: "Aucun dossier ne correspond à ces informations." }, { status: 404 });

  // Validated: hand out a fresh single-use activation link (only if the space isn't activated yet).
  let activation: { url?: string; activated: boolean } | null = null;
  if (app.status === "validee") {
    const member = get<{ id: number; activated_at: string | null; status: string }>(
      "SELECT m.id, m.activated_at, m.status FROM members m JOIN applications a ON a.member_id = m.id WHERE a.id = ?",
      app.id,
    );
    if (member && member.status !== "cloture") {
      activation = member.activated_at
        ? { activated: true }
        : { activated: false, url: `/espace/activation?token=${issueActivationToken(member.id)}` };
    }
  }

  return NextResponse.json({
    activation,
    reference: app.reference,
    status: app.status,
    offer: app.offer,
    prenom: app.prenom,
    message: app.public_message,
    createdAt: app.created_at,
    updatedAt: app.updated_at,
    timeline: publicTimeline(app.id),
  });
}
