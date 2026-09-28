import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT = { N: 16384, r: 8, p: 1 };

export function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 64, SCRYPT);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string) {
  const [algo, saltHex, keyHex] = stored.split("$");
  if (algo !== "scrypt" || !saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length, SCRYPT);
  return timingSafeEqual(expected, actual);
}

export const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

export const randomToken = () => randomBytes(32).toString("base64url");

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
export function randomCode(len: number) {
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return s;
}

/** Readable temporary password, e.g. "Kf7q-Xm2p-Rt9w". */
export function tempPassword() {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = () => Array.from({ length: 4 }, () => chars[randomInt(chars.length)]).join("");
  return `${part()}-${part()}-${part()}`;
}

function storageKey() {
  const hex = process.env.STORAGE_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("STORAGE_KEY manquante ou invalide dans .env.local (64 caractères hexadécimaux attendus).");
  }
  return Buffer.from(hex, "hex");
}

/** AES-256-GCM encryption for documents at rest. */
export function encrypt(data: Buffer) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", storageKey(), iv);
  const out = Buffer.concat([cipher.update(data), cipher.final()]);
  return { data: out, iv: iv.toString("hex"), tag: cipher.getAuthTag().toString("hex") };
}

export function decrypt(data: Buffer, ivHex: string, tagHex: string) {
  const decipher = createDecipheriv("aes-256-gcm", storageKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([decipher.update(data), decipher.final()]);
}
