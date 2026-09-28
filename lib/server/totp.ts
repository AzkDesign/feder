import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/* RFC 6238 TOTP (SHA-1, 6 digits, 30 s) — compatible with Google Authenticator, Authy, 1Password… */

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buf: Buffer) {
  let bits = 0,
    value = 0,
    out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(s: string) {
  const clean = s.replace(/=+$/, "").toUpperCase();
  let bits = 0,
    value = 0;
  const out: number[] = [];
  for (const c of clean) {
    const i = B32.indexOf(c);
    if (i < 0) continue;
    value = (value << 5) | i;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export const newTotpSecret = () => base32Encode(randomBytes(20));

function codeAt(secret: string, counter: number) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const h = createHmac("sha1", base32Decode(secret)).update(msg).digest();
  const off = h[h.length - 1] & 15;
  const n = (h.readUInt32BE(off) & 0x7fffffff) % 1_000_000;
  return n.toString().padStart(6, "0");
}

/** Accepts the current code and ±1 step for clock drift. */
export function verifyTotp(secret: string, code: string) {
  const c = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(c)) return false;
  const step = Math.floor(Date.now() / 30_000);
  for (const d of [-1, 0, 1]) {
    const expected = Buffer.from(codeAt(secret, step + d));
    if (timingSafeEqual(expected, Buffer.from(c))) return true;
  }
  return false;
}

export function otpauthUri(secret: string, account: string) {
  const label = encodeURIComponent(`Feder:${account}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=Feder&algorithm=SHA1&digits=6&period=30`;
}
