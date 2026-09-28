import { NextResponse } from "next/server";
import { clientIp, logEvent } from "@/lib/server/audit";
import { now, run, tx } from "@/lib/server/db";
import { hit } from "@/lib/server/rate-limit";
import { checkFile, removeStored, storeDocument, type Checked } from "@/lib/server/storage";
import { findForApplicant } from "@/lib/server/tracking";

/** The applicant answers a "complément demandé" request: message + up to 5 files. */
export async function POST(req: Request) {
  if (!hit(`complement:${await clientIp()}`, 10, 3600_000)) {
    return NextResponse.json({ error: "Trop d'envois. Réessayez plus tard." }, { status: 429 });
  }
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });

  const app = findForApplicant(String(form.get("reference") ?? ""), String(form.get("email") ?? ""));
  if (!app) return NextResponse.json({ error: "Aucun dossier ne correspond à ces informations." }, { status: 404 });
  if (app.status !== "complement") {
    return NextResponse.json({ error: "Aucun complément n'est attendu pour ce dossier." }, { status: 409 });
  }

  const message = String(form.get("message") ?? "").trim().slice(0, 2000);
  const raw = form.getAll("files").filter((f) => f instanceof File && f.size > 0);
  if (!message && raw.length === 0) return NextResponse.json({ error: "Ajoutez un message ou un document." }, { status: 400 });
  if (raw.length > 5) return NextResponse.json({ error: "5 fichiers maximum." }, { status: 400 });

  const files: Checked[] = [];
  for (const f of raw) {
    const c = await checkFile(f);
    if (typeof c === "string") return NextResponse.json({ error: c }, { status: 400 });
    files.push(c);
  }

  const stored: string[] = [];
  try {
    tx(() => {
      for (const f of files) stored.push(storeDocument(app.id, "complement", f, "candidat"));
      run("UPDATE applications SET status = 'en_etude', public_message = NULL, updated_at = ? WHERE id = ?", now(), app.id);
    });
  } catch (e) {
    stored.forEach(removeStored);
    console.error("complement failed", e);
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }

  const detail = [message, files.length ? `${files.length} document(s) joint(s)` : ""].filter(Boolean).join(" · ");
  await logEvent({ entityType: "application", entityId: app.id, actorType: "candidat", action: "complement_recu", detail, public: true });
  return NextResponse.json({ ok: true });
}
