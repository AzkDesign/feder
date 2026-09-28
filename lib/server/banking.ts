import "server-only";
import { createHmac } from "node:crypto";
import { offerRules } from "@/lib/banking-labels";
import { all, get, now, run, tx } from "./db";

/*
 * Simulated ledger. Every money movement goes through `post()` inside a transaction:
 * the account balance and an immutable transaction row (with balance_after) move together.
 * To go live, replace these functions with calls to a licensed banking-as-a-service provider.
 */

export class BankError extends Error {}

type Offer = keyof typeof offerRules;

/* ───────────── IBAN ───────────── */

function mod97(digits: string) {
  let r = 0;
  for (const ch of digits) r = (r * 10 + Number(ch)) % 97;
  return r;
}

const toDigits = (s: string) => s.toUpperCase().replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));

export function normalizeIban(s: string) {
  return s.replace(/\s+/g, "").toUpperCase();
}

export function isValidIban(raw: string) {
  const iban = normalizeIban(raw);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  return mod97(toDigits(iban.slice(4) + iban.slice(0, 4))) === 1;
}

/** Fictitious but checksum-valid French IBAN (bank code 17599 is a placeholder). */
function makeIban(memberId: number) {
  const bank = "17599";
  const branch = "00001";
  const account = String(10_000_000_000 + memberId * 7919).slice(-11);
  const key = 97 - ((89 * Number(bank) + 15 * Number(branch) + 3 * Number(account)) % 97);
  const bban = `${bank}${branch}${account}${String(key).padStart(2, "0")}`;
  const check = 98 - mod97(toDigits(`${bban}FR00`));
  return `FR${String(check).padStart(2, "0")}${bban}`;
}

export function ensureAccount(memberId: number) {
  const acc = get<{ iban: string; balance_cents: number }>("SELECT iban, balance_cents FROM accounts WHERE member_id = ?", memberId);
  if (acc) return acc;
  const iban = makeIban(memberId);
  run("INSERT OR IGNORE INTO accounts (member_id, iban, balance_cents, created_at) VALUES (?, ?, 0, ?)", memberId, iban, now());
  return { iban, balance_cents: 0 };
}

/* ───────────── Core posting ───────────── */

type TxFields = {
  kind: string;
  label: string;
  category?: string | null;
  counterparty?: string | null;
  note?: string | null;
  reference?: string | null;
  vaultId?: number | null;
  createdAt?: string;
};

/** Must be called inside tx(). Throws BankError on insufficient funds for debits. */
function post(memberId: number, amount: number, f: TxFields) {
  ensureAccount(memberId);
  const { balance_cents } = get<{ balance_cents: number }>("SELECT balance_cents FROM accounts WHERE member_id = ?", memberId)!;
  const after = balance_cents + amount;
  if (amount < 0 && after < 0) throw new BankError("Solde insuffisant.");
  run("UPDATE accounts SET balance_cents = ? WHERE member_id = ?", after, memberId);
  run(
    `INSERT INTO transactions (member_id, vault_id, amount_cents, balance_after_cents, kind, label, category, counterparty, note, reference, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    memberId, f.vaultId ?? null, amount, after, f.kind, f.label, f.category ?? null, f.counterparty ?? null, f.note ?? null,
    f.reference ?? null, f.createdAt ?? now(),
  );
  return after;
}

function assertActive(memberId: number) {
  const m = get<{ status: string }>("SELECT status FROM members WHERE id = ?", memberId);
  if (!m || m.status !== "actif") throw new BankError("Ce compte n'est pas actif.");
}

const cents = (n: number) => {
  if (!Number.isInteger(n) || n <= 0) throw new BankError("Montant invalide.");
  if (n > 1_000_000_00) throw new BankError("Montant trop élevé.");
  return n;
};

/* ───────────── Deposits (admin simulation) ───────────── */

export function deposit(memberId: number, amount: number, label: string, createdAt?: string) {
  return tx(() => post(memberId, cents(amount), { kind: "deposit", label, category: null, createdAt }));
}

/* ───────────── Card ───────────── */

export type CardAttempt = { merchant: string; category: string; amount: number; online?: boolean; abroad?: boolean; contactless?: boolean; createdAt?: string };

/** Simulates an authorisation: every card rule is enforced; a decline is recorded but moves no money. */
export function cardPayment(memberId: number, p: CardAttempt): { ok: boolean; reason?: string } {
  const amount = cents(p.amount);
  const m = get<{
    status: string; card_status: string; offer: Offer; card_online: number; card_contactless: number; card_abroad: number;
    limit_payment_cents: number | null;
  }>("SELECT status, card_status, offer, card_online, card_contactless, card_abroad, limit_payment_cents FROM members WHERE id = ?", memberId);
  if (!m) throw new BankError("Membre introuvable.");

  const limit = m.limit_payment_cents ?? offerRules[m.offer].maxPayment;
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const spent = -(get<{ s: number | null }>(
    "SELECT SUM(amount_cents) s FROM transactions WHERE member_id = ? AND kind = 'card' AND status = 'ok' AND created_at >= ?",
    memberId, monthStart,
  )!.s ?? 0);

  let reason: string | undefined;
  if (m.status !== "actif") reason = "Compte inactif";
  else if (m.card_status === "gelee") reason = "Carte gelée";
  else if (m.card_status !== "active") reason = "Carte non active";
  else if (p.online && !m.card_online) reason = "Paiements en ligne désactivés";
  else if (p.abroad && !m.card_abroad) reason = "Paiements à l'étranger désactivés";
  else if (p.contactless && !m.card_contactless) reason = "Sans contact désactivé";
  else if (spent + amount > limit) reason = "Plafond mensuel atteint";
  else {
    const bal = ensureAccount(memberId).balance_cents;
    if (bal < amount) reason = "Solde insuffisant";
  }

  if (reason) {
    const bal = ensureAccount(memberId).balance_cents;
    run(
      `INSERT INTO transactions (member_id, amount_cents, balance_after_cents, kind, status, label, category, note, created_at)
       VALUES (?, ?, ?, 'card', 'refusee', ?, ?, ?, ?)`,
      memberId, -amount, bal, p.merchant, p.category, reason, p.createdAt ?? now(),
    );
    return { ok: false, reason };
  }
  tx(() => post(memberId, -amount, { kind: "card", label: p.merchant, category: p.category, createdAt: p.createdAt }));
  return { ok: true };
}

/** Credits last months' cashback once (idempotent through a unique reference). */
export function settleCashback(memberId: number) {
  const m = get<{ offer: Offer; activated_at: string | null }>("SELECT offer, activated_at FROM members WHERE id = ?", memberId);
  if (!m) return;
  const current = new Date().toISOString().slice(0, 7);
  const months = all<{ ym: string; spent: number }>(
    `SELECT substr(created_at, 1, 7) ym, -SUM(amount_cents) spent FROM transactions
      WHERE member_id = ? AND kind = 'card' AND status = 'ok' AND substr(created_at, 1, 7) < ? GROUP BY ym`,
    memberId, current,
  );
  for (const { ym, spent } of months) {
    const ref = `CASHBACK-${memberId}-${ym}`;
    if (get("SELECT 1 FROM transactions WHERE reference = ?", ref)) continue;
    const amount = Math.floor((spent * offerRules[m.offer].cashbackBps) / 10_000);
    if (amount <= 0) continue;
    const [y, mo] = ym.split("-").map(Number);
    const paidAt = new Date(Date.UTC(y, mo, 1, 6)).toISOString();
    const monthName = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(Date.UTC(y, mo - 1, 15)));
    tx(() => post(memberId, amount, { kind: "cashback", label: `Cashback · ${monthName}`, reference: ref, createdAt: paidAt }));
  }
}

export function monthCashbackPreview(memberId: number, offer: Offer) {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const spent = -(get<{ s: number | null }>(
    "SELECT SUM(amount_cents) s FROM transactions WHERE member_id = ? AND kind = 'card' AND status = 'ok' AND created_at >= ?",
    memberId, monthStart,
  )!.s ?? 0);
  return { spent, cashback: Math.floor((spent * offerRules[offer].cashbackBps) / 10_000) };
}

/** Simulated card data, derived deterministically so it stays stable for a given card. */
export function cardDetails(memberId: number, last4: string, createdAt: string) {
  const key = process.env.STORAGE_KEY ?? "feder";
  const h = createHmac("sha256", key).update(`${memberId}:${last4}`).digest();
  const mid = Array.from(h.subarray(0, 8), (b) => b % 10).join("");
  const d = new Date(createdAt);
  return {
    pan: `4978${mid}${last4}`.replace(/(.{4})/g, "$1 ").trim(),
    expiry: `${String(d.getMonth() + 1).padStart(2, "0")}/${String((d.getFullYear() + 4) % 100).padStart(2, "0")}`,
    cvv: String(100 + (h.readUInt16BE(10) % 900)),
  };
}

/* ───────────── Transfers ───────────── */

export function findRecipient(memberNumber: string) {
  return get<{ id: number; prenom: string; nom: string; member_number: string; status: string; activated_at: string | null }>(
    "SELECT id, prenom, nom, member_number, status, activated_at FROM members WHERE member_number = ?",
    memberNumber.trim().toUpperCase(),
  );
}

export function federPay(fromId: number, toNumber: string, amount: number, note: string) {
  const a = cents(amount);
  assertActive(fromId);
  const to = findRecipient(toNumber);
  if (!to || to.status !== "actif") throw new BankError("Aucun membre actif ne correspond à ce numéro.");
  if (to.id === fromId) throw new BankError("Vous ne pouvez pas vous envoyer de l'argent.");
  const from = get<{ prenom: string; nom: string; member_number: string }>("SELECT prenom, nom, member_number FROM members WHERE id = ?", fromId)!;
  const t = now();
  tx(() => {
    post(fromId, -a, { kind: "feder_pay_out", label: `${to.prenom} ${to.nom}`, counterparty: to.member_number, note, createdAt: t });
    post(to.id, a, { kind: "feder_pay_in", label: `${from.prenom} ${from.nom}`, counterparty: from.member_number, note, createdAt: t });
  });
  return to;
}

export function externalTransfer(memberId: number, beneficiaryId: number, amount: number, label: string) {
  const a = cents(amount);
  assertActive(memberId);
  const b = get<{ name: string; iban: string }>("SELECT name, iban FROM beneficiaries WHERE id = ? AND member_id = ?", beneficiaryId, memberId);
  if (!b) throw new BankError("Bénéficiaire introuvable.");
  tx(() => post(memberId, -a, { kind: "transfer_out", label: b.name, counterparty: b.iban, note: label || null }));
  return b;
}

/* ───────────── Vaults ───────────── */

export function vaultMove(memberId: number, vaultId: number, amount: number, direction: "in" | "out") {
  const a = cents(amount);
  const v = get<{ name: string; balance_cents: number; closed_at: string | null }>(
    "SELECT name, balance_cents, closed_at FROM vaults WHERE id = ? AND member_id = ?", vaultId, memberId,
  );
  if (!v || v.closed_at) throw new BankError("Coffre introuvable.");
  if (direction === "out" && v.balance_cents < a) throw new BankError("Le coffre ne contient pas autant.");
  tx(() => {
    if (direction === "in") {
      post(memberId, -a, { kind: "vault_in", label: v.name, vaultId });
      run("UPDATE vaults SET balance_cents = balance_cents + ? WHERE id = ?", a, vaultId);
    } else {
      run("UPDATE vaults SET balance_cents = balance_cents - ? WHERE id = ?", a, vaultId);
      post(memberId, a, { kind: "vault_out", label: v.name, vaultId });
    }
  });
}

export function closeVault(memberId: number, vaultId: number) {
  const v = get<{ name: string; balance_cents: number; closed_at: string | null }>(
    "SELECT name, balance_cents, closed_at FROM vaults WHERE id = ? AND member_id = ?", vaultId, memberId,
  );
  if (!v || v.closed_at) throw new BankError("Coffre introuvable.");
  tx(() => {
    if (v.balance_cents > 0) {
      run("UPDATE vaults SET balance_cents = 0 WHERE id = ?", vaultId);
      post(memberId, v.balance_cents, { kind: "vault_out", label: `${v.name} (clôture)`, vaultId });
    }
    run("UPDATE vaults SET closed_at = ? WHERE id = ?", now(), vaultId);
  });
}

/* ───────────── Demo history (development fixtures) ───────────── */

const DEMO_SPEND: [string, string, number, number][] = [
  ["Restaurant étoilé", "restaurants", 180, 420],
  ["Bistrot du quartier", "restaurants", 35, 90],
  ["Compagnie aérienne", "voyage", 450, 2600],
  ["Hôtel · Paris 8e", "hotels", 380, 1200],
  ["Maison de couture", "shopping", 240, 1800],
  ["Librairie", "loisirs", 25, 80],
  ["Chauffeur privé", "transport", 45, 140],
  ["Abonnement streaming", "services", 12, 18],
  ["Galerie d'art", "loisirs", 300, 2400],
];

/** Fills ~60 days of realistic-looking history. Bypasses card rules on purpose (past dates). */
export function seedHistory(memberId: number) {
  const r = (a: number, b: number) => a + Math.random() * (b - a);
  const day = 86400_000;
  const events: { at: number; fn: () => void }[] = [];
  for (let d = 60; d >= 0; d -= 30) {
    const at = Date.now() - d * day - 2 * day;
    events.push({ at, fn: () => post(memberId, Math.round(r(9000, 18000)) * 100, { kind: "transfer_in", label: "Salaire", counterparty: "Employeur", createdAt: new Date(at).toISOString() }) });
  }
  for (let i = 0; i < 38; i++) {
    const at = Date.now() - r(0, 60) * day;
    const [label, category, min, max] = DEMO_SPEND[Math.floor(Math.random() * DEMO_SPEND.length)];
    const amount = Math.round(r(min, max) * 100);
    events.push({ at, fn: () => post(memberId, -amount, { kind: "card", label, category, createdAt: new Date(at).toISOString() }) });
  }
  events.sort((a, b) => a.at - b.at);
  tx(() => {
    for (const e of events) {
      try {
        e.fn();
      } catch (err) {
        if (!(err instanceof BankError)) throw err; // skip a spend the balance can't cover
      }
    }
  });
}

/* ───────────── Read models ───────────── */

export type TxRow = {
  id: number;
  amount_cents: number;
  balance_after_cents: number;
  kind: string;
  status: string;
  label: string;
  category: string | null;
  counterparty: string | null;
  note: string | null;
  created_at: string;
};

export function recentTransactions(memberId: number, limit = 8) {
  return all<TxRow>("SELECT * FROM transactions WHERE member_id = ? ORDER BY created_at DESC, id DESC LIMIT ?", memberId, limit);
}

export function searchTransactions(memberId: number, f: { q?: string; kind?: string; category?: string; month?: string; page?: number }) {
  const where = ["member_id = ?"];
  const p: (string | number)[] = [memberId];
  if (f.q) (where.push("(label LIKE ? OR note LIKE ? OR counterparty LIKE ?)"), p.push(`%${f.q}%`, `%${f.q}%`, `%${f.q}%`));
  if (f.kind === "in") where.push("amount_cents > 0 AND status = 'ok'");
  if (f.kind === "out") where.push("amount_cents < 0 AND status = 'ok'");
  if (f.kind === "refusee") where.push("status = 'refusee'");
  if (f.category) (where.push("category = ?"), p.push(f.category));
  if (f.month) (where.push("substr(created_at, 1, 7) = ?"), p.push(f.month));
  const sql = where.join(" AND ");
  const size = 30;
  const page = Math.max(1, f.page ?? 1);
  const total = get<{ n: number }>(`SELECT COUNT(*) n FROM transactions WHERE ${sql}`, ...p)!.n;
  const rows = all<TxRow>(`SELECT * FROM transactions WHERE ${sql} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`, ...p, size, (page - 1) * size);
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / size)) };
}

/** End-of-day balance for the last `days` days (for the sparkline). */
export function balanceSeries(memberId: number, days = 30) {
  const rows = all<{ d: string; b: number }>(
    `SELECT substr(created_at, 1, 10) d, balance_after_cents b FROM transactions
      WHERE member_id = ? AND status = 'ok' AND id IN (
        SELECT MAX(id) FROM transactions WHERE member_id = ? AND status = 'ok' GROUP BY substr(created_at, 1, 10))
      ORDER BY d`,
    memberId, memberId,
  );
  const map = new Map(rows.map((r) => [r.d, r.b]));
  const start = new Date(Date.now() - (days - 1) * 86400_000).toISOString().slice(0, 10);
  let last = get<{ b: number }>(
    "SELECT balance_after_cents b FROM transactions WHERE member_id = ? AND status = 'ok' AND substr(created_at, 1, 10) < ? ORDER BY created_at DESC, id DESC LIMIT 1",
    memberId, start,
  )?.b ?? 0;
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 86400_000).toISOString().slice(0, 10);
    if (map.has(d)) last = map.get(d)!;
    return { d, b: last };
  });
}

export function spendingByCategory(memberId: number, month = new Date().toISOString().slice(0, 7)) {
  return all<{ category: string; total: number; n: number }>(
    `SELECT COALESCE(category, 'autre') category, -SUM(amount_cents) total, COUNT(*) n FROM transactions
      WHERE member_id = ? AND kind = 'card' AND status = 'ok' AND substr(created_at, 1, 7) = ?
      GROUP BY category ORDER BY total DESC`,
    memberId, month,
  );
}

export function vaultsOf(memberId: number) {
  return all<{ id: number; name: string; icon: string; target_cents: number; balance_cents: number; created_at: string }>(
    "SELECT id, name, icon, target_cents, balance_cents, created_at FROM vaults WHERE member_id = ? AND closed_at IS NULL ORDER BY created_at",
    memberId,
  );
}
