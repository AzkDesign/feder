import { NextResponse } from "next/server";
import { clientIp, logEvent } from "@/lib/server/audit";
import { randomCode } from "@/lib/server/crypto";
import { get, getSettings, now, run, tx } from "@/lib/server/db";
import { hit } from "@/lib/server/rate-limit";
import { checkFile, removeStored, storeDocument, type Checked } from "@/lib/server/storage";

const TEXT_FIELDS = {
  civilite: 20, prenom: 80, nom: 80, naissance: 10, nationalite: 80, email: 160, telephone: 40,
  adresse: 200, codePostal: 20, ville: 100, pays: 80, profession: 120, revenus: 60, patrimoine: 60, origine: 80,
} as const;
const FILES = { docIdentite: "identite", docDomicile: "domicile", docRevenus: "revenus" } as const;
const OFFERS = ["gold", "platine", "noire"];

export async function POST(req: Request) {
  const settings = getSettings();
  if (settings.admissions_open !== "1") {
    return NextResponse.json({ error: settings.closed_message }, { status: 403 });
  }
  if (!hit(`admission:${await clientIp()}`, 5, 3600_000)) {
    return NextResponse.json({ error: "Trop de demandes depuis cette connexion. Réessayez dans une heure." }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const v: Record<string, string> = {};
  for (const [k, max] of Object.entries(TEXT_FIELDS)) {
    const val = String(form.get(k) ?? "").trim();
    if (!val) return NextResponse.json({ error: "Champs obligatoires manquants.", field: k }, { status: 400 });
    v[k] = val.slice(0, max);
  }
  if (!/^\S+@\S+\.\S+$/.test(v.email)) return NextResponse.json({ error: "E-mail invalide.", field: "email" }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.naissance)) return NextResponse.json({ error: "Date de naissance invalide." }, { status: 400 });
  const offer = String(form.get("offre") ?? "");
  if (!OFFERS.includes(offer)) return NextResponse.json({ error: "Offre invalide." }, { status: 400 });
  if (form.get("consentExact") !== "1" || form.get("consentData") !== "1") {
    return NextResponse.json({ error: "Les deux attestations sont requises." }, { status: 400 });
  }

  const files: [string, Checked][] = [];
  for (const [field, kind] of Object.entries(FILES)) {
    const checked = await checkFile(form.get(field));
    if (typeof checked === "string") return NextResponse.json({ error: checked, field }, { status: 400 });
    files.push([kind, checked]);
  }

  let reference = "";
  do reference = `FDR-${randomCode(8)}`;
  while (get("SELECT 1 FROM applications WHERE reference = ?", reference));

  const stored: string[] = [];
  let id = 0;
  try {
    tx(() => {
      const t = now();
      const res = run(
        `INSERT INTO applications (reference, offer, civilite, prenom, nom, naissance, nationalite, email, telephone,
           adresse, code_postal, ville, pays, profession, revenus, patrimoine, origine, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        reference, offer, v.civilite, v.prenom, v.nom, v.naissance, v.nationalite, v.email, v.telephone,
        v.adresse, v.codePostal, v.ville, v.pays, v.profession, v.revenus, v.patrimoine, v.origine, t, t,
      );
      id = Number(res.lastInsertRowid);
      for (const [kind, f] of files) stored.push(storeDocument(id, kind, f, "candidat"));
    });
  } catch (e) {
    stored.forEach(removeStored);
    console.error("admission insert failed", e);
    return NextResponse.json({ error: "Une erreur est survenue. Merci de réessayer." }, { status: 500 });
  }

  await logEvent({ entityType: "application", entityId: id, actorType: "candidat", action: "demande_deposee", public: true });
  return NextResponse.json({ reference });
}
