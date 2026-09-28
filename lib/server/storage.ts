import "server-only";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { decrypt, encrypt } from "./crypto";
import { get, now, run, UPLOAD_DIR } from "./db";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Detect the real type from magic bytes — never trust the browser-provided MIME. */
function sniff(buf: Buffer): string | null {
  if (buf.subarray(0, 4).toString("latin1") === "%PDF") return "application/pdf";
  if (buf[0] === 0x89 && buf.subarray(1, 4).toString("latin1") === "PNG") return "image/png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  return null;
}

export type Checked = { name: string; mime: string; buf: Buffer };

/** Validate an uploaded File. Returns an error message or the checked payload. */
export async function checkFile(file: unknown): Promise<Checked | string> {
  if (!(file instanceof File) || file.size === 0) return "Fichier manquant.";
  if (file.size > MAX_FILE_BYTES) return `« ${file.name} » dépasse 10 Mo.`;
  const buf = Buffer.from(await file.arrayBuffer());
  const mime = sniff(buf);
  if (!mime) return `« ${file.name} » n'est pas un PDF, JPG ou PNG valide.`;
  const name = file.name.replace(/[^\p{L}\p{N}._ -]/gu, "_").slice(0, 120) || "document";
  return { name, mime, buf };
}

export function storeDocument(applicationId: number, kind: string, f: Checked, uploadedBy: "candidat" | "admin") {
  const enc = encrypt(f.buf);
  const storageName = `${randomUUID()}.bin`;
  fs.writeFileSync(path.join(UPLOAD_DIR, storageName), enc.data, { mode: 0o600 });
  run(
    `INSERT INTO documents (application_id, kind, original_name, mime, size, storage_name, iv, tag, uploaded_by, uploaded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    applicationId,
    kind,
    f.name,
    f.mime,
    f.buf.length,
    storageName,
    enc.iv,
    enc.tag,
    uploadedBy,
    now(),
  );
  return storageName;
}

export function removeStored(storageName: string) {
  fs.rmSync(path.join(UPLOAD_DIR, path.basename(storageName)), { force: true });
}

export function readDocument(id: number) {
  const doc = get<{
    id: number;
    application_id: number;
    original_name: string;
    mime: string;
    storage_name: string;
    iv: string;
    tag: string;
  }>("SELECT id, application_id, original_name, mime, storage_name, iv, tag FROM documents WHERE id = ?", id);
  if (!doc) return null;
  const raw = fs.readFileSync(path.join(UPLOAD_DIR, path.basename(doc.storage_name)));
  return { ...doc, data: decrypt(raw, doc.iv, doc.tag) };
}
