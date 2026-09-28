"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "./actions";
import { logEvent } from "@/lib/server/audit";
import { requireAdmin } from "@/lib/server/auth";
import { randomCode } from "@/lib/server/crypto";
import { all, run, tx } from "@/lib/server/db";
import { seedHistory } from "@/lib/server/banking";
import { storeDocument } from "@/lib/server/storage";

/* Development-only fixtures: clearly fictitious people, never real data. */

const FIRST = ["Camille", "Hugo", "Léa", "Louis", "Chloé", "Gabriel", "Inès", "Arthur", "Manon", "Jules", "Sarah", "Adam", "Emma", "Raphaël", "Zoé", "Nathan"];
const LAST = ["Martin", "Bernard", "Dubois", "Laurent", "Moreau", "Lefèvre", "Garnier", "Rousseau", "Fontaine", "Chevalier", "Mercier", "Blanchard", "Girard", "Morel"];
const CITIES = ["Paris", "Lyon", "Bordeaux", "Nice", "Lille", "Nantes", "Genève", "Bruxelles", "Monaco", "Marseille"];
const JOBS = ["Chef d'entreprise", "Avocate", "Médecin", "Directeur financier", "Architecte", "Consultante", "Ingénieur", "Notaire"];
const REV = ["50 000 à 100 000 €", "100 000 à 250 000 €", "Plus de 250 000 €"];
const PAT = ["100 000 à 500 000 €", "500 000 € à 1 M€", "Plus de 1 M€"];

// Minimal valid one-page PDF reading "Document de démonstration".
const DEMO_PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
    "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n" +
    "4 0 obj<</Length 60>>stream\nBT /F1 22 Tf 120 700 Td (Document de demonstration) Tj ET\nendstream endobj\n" +
    "5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF",
);

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export async function seedDemoAction(_: FormState): Promise<FormState> {
  if (process.env.NODE_ENV === "production") return { error: "Indisponible en production." };
  const admin = await requireAdmin("super_admin");
  const team = all<{ id: number }>("SELECT id FROM admins WHERE active = 1");

  const statuses = ["nouvelle", "nouvelle", "en_etude", "en_etude", "complement", "validee", "validee", "validee", "refusee"];
  const offers = ["gold", "gold", "platine", "platine", "platine", "noire"];

  const newMembers: number[] = [];
  tx(() => {
    for (let i = 0; i < 40; i++) {
      const created = new Date(Date.now() - Math.random() * 30 * 86400_000);
      const status = pick(statuses);
      const offer = pick(offers);
      const prenom = pick(FIRST);
      const nom = pick(LAST);
      const email = `${prenom}.${nom}.${randomCode(4)}@exemple.test`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      const ville = pick(CITIES);
      const decided = ["validee", "refusee"].includes(status) ? new Date(created.getTime() + (6 + Math.random() * 60) * 3600_000) : null;
      const updated = decided ?? new Date(created.getTime() + Math.random() * 24 * 3600_000);
      const assigned = status === "nouvelle" ? null : pick(team).id;
      const msg =
        status === "complement" ? "Merci de nous transmettre votre dernier avis d'imposition complet." :
        status === "validee" ? "Félicitations, votre admission est validée. Bienvenue chez Feder." :
        status === "refusee" ? "Après examen attentif, nous ne sommes pas en mesure de donner une suite favorable à votre demande." : null;

      const res = run(
        `INSERT INTO applications (reference, status, offer, civilite, prenom, nom, naissance, nationalite, email, telephone,
           adresse, code_postal, ville, pays, profession, revenus, patrimoine, origine, assigned_to, public_message, decision_reason,
           created_at, updated_at, decided_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Française', ?, '+33 6 00 00 00 00', '1 rue de l''Exemple', '75000', ?, 'France', ?, ?, ?, 'Revenus professionnels', ?, ?, ?, ?, ?, ?)`,
        `FDR-${randomCode(8)}`, status, offer, pick(["Madame", "Monsieur"]), prenom, nom,
        `19${60 + Math.floor(Math.random() * 35)}-0${1 + Math.floor(Math.random() * 9)}-1${Math.floor(Math.random() * 9)}`,
        email, ville, pick(JOBS), pick(REV), pick(PAT), assigned, msg,
        status === "refusee" ? "Données de démonstration" : null,
        created.toISOString(), updated.toISOString(), decided?.toISOString() ?? null,
      );
      const id = Number(res.lastInsertRowid);
      for (const kind of ["identite", "domicile", "revenus"]) {
        storeDocument(id, kind, { name: `demo-${kind}.pdf`, mime: "application/pdf", buf: DEMO_PDF }, "candidat");
      }
      run(
        "INSERT INTO events (entity_type, entity_id, actor_type, action, public, ip, created_at) VALUES ('application', ?, 'candidat', 'demande_deposee', 1, 'demo', ?)",
        id, created.toISOString(),
      );

      if (status === "validee") {
        const m = run(
          `INSERT INTO members (member_number, application_id, prenom, nom, email, ville, pays, offer, status, card_status, card_last4, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, 'France', ?, ?, ?, ?, ?, ?)`,
          `TMP-${randomCode(10)}`, id, prenom, nom, email, ville, offer,
          Math.random() < 0.1 ? "suspendu" : "actif",
          pick(["en_fabrication", "expediee", "active", "active", "active"]),
          String(1000 + Math.floor(Math.random() * 9000)),
          decided!.toISOString(), decided!.toISOString(),
        );
        const mid = Number(m.lastInsertRowid);
        run("UPDATE members SET member_number = ? WHERE id = ?", `FD-${100000 + mid}`, mid);
        run("UPDATE applications SET member_id = ? WHERE id = ?", mid, id);
        newMembers.push(mid);
      }
    }
  });
  // Account history for demo members (salary + card spending over ~60 days).
  for (const mid of newMembers) seedHistory(mid);

  await logEvent({ entityType: "settings", actorType: "admin", actorId: admin.id, action: "donnees_demo", detail: "40 dossiers" });
  revalidatePath("/admin", "layout");
  return { ok: "40 dossiers de démonstration créés." };
}
