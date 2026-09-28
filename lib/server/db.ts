import "server-only";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { hashPassword } from "./crypto";

export const DATA_DIR = process.env.FEDER_DATA_DIR ?? path.join(process.cwd(), "data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin','analyste')),
  password_hash TEXT NOT NULL,
  must_change_password INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  window_start INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'nouvelle'
    CHECK (status IN ('nouvelle','en_etude','complement','validee','refusee')),
  offer TEXT NOT NULL CHECK (offer IN ('gold','platine','noire')),
  civilite TEXT, prenom TEXT NOT NULL, nom TEXT NOT NULL, naissance TEXT, nationalite TEXT,
  email TEXT NOT NULL COLLATE NOCASE, telephone TEXT,
  adresse TEXT, code_postal TEXT, ville TEXT, pays TEXT,
  profession TEXT, revenus TEXT, patrimoine TEXT, origine TEXT,
  assigned_to INTEGER REFERENCES admins(id) ON DELETE SET NULL,
  public_message TEXT,
  decision_reason TEXT,
  member_id INTEGER REFERENCES members(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  decided_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_app_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_app_created ON applications(created_at);

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  storage_name TEXT NOT NULL,
  iv TEXT NOT NULL,
  tag TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY,
  member_number TEXT NOT NULL UNIQUE,
  application_id INTEGER,
  civilite TEXT, prenom TEXT NOT NULL, nom TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE, telephone TEXT, ville TEXT, pays TEXT,
  offer TEXT NOT NULL CHECK (offer IN ('gold','platine','noire')),
  status TEXT NOT NULL DEFAULT 'actif' CHECK (status IN ('actif','suspendu','cloture')),
  card_status TEXT NOT NULL DEFAULT 'en_fabrication'
    CHECK (card_status IN ('en_fabrication','expediee','active','gelee','opposee')),
  card_last4 TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_member_status ON members(status);

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notes_entity ON notes(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  actor_type TEXT NOT NULL,
  actor_id INTEGER,
  action TEXT NOT NULL,
  detail TEXT,
  public INTEGER NOT NULL DEFAULT 0,
  ip TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_entity ON events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

/* ───── Member area (« Le Salon ») ───── */

CREATE TABLE IF NOT EXISTS member_sessions (
  token_hash TEXT PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  mfa_ok INTEGER NOT NULL DEFAULT 0,
  reauth_at TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT,
  ip TEXT,
  user_agent TEXT
);

-- Simulated ledger. Amounts are integer cents. Balance is kept on the account and
-- every movement is an immutable transaction row carrying the resulting balance.
CREATE TABLE IF NOT EXISTS accounts (
  member_id INTEGER PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
  iban TEXT NOT NULL UNIQUE,
  balance_cents INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vaults (
  id INTEGER PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'star',
  target_cents INTEGER NOT NULL,
  balance_cents INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  closed_at TEXT
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  vault_id INTEGER REFERENCES vaults(id),
  amount_cents INTEGER NOT NULL,
  balance_after_cents INTEGER NOT NULL,
  kind TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok','refusee')),
  label TEXT NOT NULL,
  category TEXT,
  counterparty TEXT,
  note TEXT,
  reference TEXT UNIQUE,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tx_member ON transactions(member_id, created_at);

CREATE TABLE IF NOT EXISTS beneficiaries (
  id INTEGER PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  iban TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (member_id, iban)
);

CREATE TABLE IF NOT EXISTS virtual_cards (
  id INTEGER PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  last4 TEXT NOT NULL,
  single_use INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','utilisee','supprimee')),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS concierge_messages (
  id INTEGER PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('member','admin')),
  admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  read_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_concierge_member ON concierge_messages(member_id, id);

CREATE TABLE IF NOT EXISTS event_rsvps (
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  event_key TEXT NOT NULL,
  guests INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  PRIMARY KEY (member_id, event_key)
);
`;

/* Columns added to existing tables after the first release (SQLite has no ADD COLUMN IF NOT EXISTS). */
const MEMBER_COLUMNS: Record<string, string> = {
  password_hash: "TEXT",
  totp_secret: "TEXT",
  totp_enabled: "INTEGER NOT NULL DEFAULT 0",
  recovery_codes: "TEXT",
  activation_token_hash: "TEXT",
  activation_expires_at: "TEXT",
  activated_at: "TEXT",
  last_login_at: "TEXT",
  card_online: "INTEGER NOT NULL DEFAULT 1",
  card_contactless: "INTEGER NOT NULL DEFAULT 1",
  card_abroad: "INTEGER NOT NULL DEFAULT 1",
  limit_payment_cents: "INTEGER",
  limit_withdrawal_cents: "INTEGER",
};

function migrate(db: DatabaseSync) {
  const existing = new Set((db.prepare("PRAGMA table_info(members)").all() as { name: string }[]).map((c) => c.name));
  for (const [col, type] of Object.entries(MEMBER_COLUMNS)) {
    if (!existing.has(col)) db.exec(`ALTER TABLE members ADD COLUMN ${col} ${type}`);
  }
}

const DEFAULT_SETTINGS: Record<string, string> = {
  admissions_open: "1",
  closed_message: "Les admissions sont momentanément suspendues. Revenez très prochainement.",
  sla_hours: "48",
  fee_gold: "19",
  fee_platine: "49",
  fee_noire: "150",
};

export const now = () => new Date().toISOString();

function open() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const db = new DatabaseSync(path.join(DATA_DIR, "feder.db"));
  db.exec("PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);
  migrate(db);

  const setDefault = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) setDefault.run(k, v);

  // First run: create the super admin from .env.local, forced to change password on first login.
  const { n } = db.prepare("SELECT COUNT(*) AS n FROM admins").get() as { n: number };
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (n === 0 && email && password) {
    db.prepare(
      "INSERT INTO admins (email, name, role, password_hash, must_change_password, created_at) VALUES (?, ?, 'super_admin', ?, 1, ?)",
    ).run(email, process.env.ADMIN_NAME ?? "Administrateur", hashPassword(password), now());
  }
  return db;
}

// Opened lazily on first query (not at import, so builds never touch the database);
// cached on globalThis so dev hot-reloads reuse one connection.
const g = globalThis as unknown as { __federDb?: DatabaseSync };
const db = () => (g.__federDb ??= open());

/** Run `fn` inside a transaction. */
export function tx<T>(fn: () => T): T {
  db().exec("BEGIN IMMEDIATE");
  try {
    const out = fn();
    db().exec("COMMIT");
    return out;
  } catch (e) {
    db().exec("ROLLBACK");
    throw e;
  }
}

// node:sqlite returns null-prototype rows; copy them into plain objects so they can be
// passed to Client Components.
export function all<T>(sql: string, ...params: (string | number | null)[]): T[] {
  return db().prepare(sql).all(...params).map((r) => ({ ...r })) as T[];
}
export function get<T>(sql: string, ...params: (string | number | null)[]): T | undefined {
  const r = db().prepare(sql).get(...params);
  return (r ? { ...r } : undefined) as T | undefined;
}
export function run(sql: string, ...params: (string | number | null)[]) {
  return db().prepare(sql).run(...params);
}

export function getSettings(): Record<string, string> {
  const rows = all<{ key: string; value: string }>("SELECT key, value FROM settings");
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
