import "server-only";
import { all, get, getSettings } from "./db";

export const PAGE_SIZE = 20;

type Params = (string | number | null)[];

/* ───────────── Dashboard ───────────── */

export function dashboard(adminId: number) {
  const s = getSettings();
  const slaMs = Number(s.sla_hours) * 3600_000;
  const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();
  const startToday = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

  const byStatus = Object.fromEntries(
    all<{ status: string; n: number }>("SELECT status, COUNT(*) n FROM applications GROUP BY status").map((r) => [r.status, r.n]),
  ) as Record<string, number>;

  const open = all<{ id: number; created_at: string }>(
    "SELECT id, created_at FROM applications WHERE status IN ('nouvelle','en_etude')",
  );
  const overdue = open.filter((a) => Date.now() - new Date(a.created_at).getTime() > slaMs).length;

  const decided = get<{ ok: number; ko: number }>(
    `SELECT SUM(status = 'validee') ok, SUM(status = 'refusee') ko FROM applications WHERE decided_at >= ?`,
    since30,
  )!;
  const avgDecision = get<{ h: number | null }>(
    `SELECT AVG((julianday(decided_at) - julianday(created_at)) * 24) h FROM applications WHERE decided_at >= ?`,
    since30,
  )!.h;

  const members = all<{ offer: string; n: number }>("SELECT offer, COUNT(*) n FROM members WHERE status = 'actif' GROUP BY offer");
  const memberCount = Object.fromEntries(members.map((m) => [m.offer, m.n])) as Record<string, number>;
  const mrr =
    (memberCount.gold ?? 0) * Number(s.fee_gold) +
    (memberCount.platine ?? 0) * Number(s.fee_platine) +
    (memberCount.noire ?? 0) * Number(s.fee_noire);

  // Applications per day over the last 30 days (zero-filled).
  const perDayRows = all<{ d: string; n: number }>(
    "SELECT substr(created_at, 1, 10) d, COUNT(*) n FROM applications WHERE created_at >= ? GROUP BY d",
    since30,
  );
  const perDayMap = new Map(perDayRows.map((r) => [r.d, r.n]));
  const perDay = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400_000).toISOString().slice(0, 10);
    return { d, n: perDayMap.get(d) ?? 0 };
  });

  const offers = all<{ offer: string; n: number }>(
    "SELECT offer, COUNT(*) n FROM applications WHERE created_at >= ? GROUP BY offer",
    since30,
  );

  const queue = all<QueueRow>(
    `SELECT a.id, a.reference, a.prenom, a.nom, a.offer, a.status, a.created_at, ad.name assignee
       FROM applications a LEFT JOIN admins ad ON ad.id = a.assigned_to
      WHERE a.status IN ('nouvelle','en_etude','complement')
      ORDER BY (a.assigned_to = ?) DESC, a.created_at ASC LIMIT 8`,
    adminId,
  );

  const activity = all<EventRow>(
    `SELECT e.*, ad.name admin_name FROM events e LEFT JOIN admins ad ON ad.id = e.actor_id AND e.actor_type = 'admin'
      WHERE e.entity_type IN ('application','member') ORDER BY e.created_at DESC, e.id DESC LIMIT 10`,
  );

  const mine = get<{ n: number }>(
    "SELECT COUNT(*) n FROM applications WHERE assigned_to = ? AND status IN ('nouvelle','en_etude','complement')",
    adminId,
  )!.n;

  return {
    byStatus,
    pending: (byStatus.nouvelle ?? 0) + (byStatus.en_etude ?? 0) + (byStatus.complement ?? 0),
    today: get<{ n: number }>("SELECT COUNT(*) n FROM applications WHERE created_at >= ?", startToday)!.n,
    overdue,
    validated30: decided.ok ?? 0,
    refused30: decided.ko ?? 0,
    acceptance: decided.ok + decided.ko > 0 ? Math.round((decided.ok / (decided.ok + decided.ko)) * 100) : null,
    avgDecisionHours: avgDecision ? Math.round(avgDecision) : null,
    activeMembers: members.reduce((n, m) => n + m.n, 0),
    memberCount,
    mrr,
    perDay,
    offers,
    queue,
    activity,
    mine,
    slaHours: Number(s.sla_hours),
  };
}

export type QueueRow = {
  id: number;
  reference: string;
  prenom: string;
  nom: string;
  offer: string;
  status: string;
  created_at: string;
  assignee: string | null;
};

export type EventRow = {
  id: number;
  entity_type: string;
  entity_id: number | null;
  actor_type: string;
  actor_id: number | null;
  admin_name: string | null;
  action: string;
  detail: string | null;
  public: number;
  ip: string | null;
  created_at: string;
};

/* ───────────── Applications ───────────── */

export type AppFilters = { status?: string; offer?: string; q?: string; assigned?: string; sort?: string; page?: number };

function appWhere(f: AppFilters, adminId: number) {
  const where: string[] = [];
  const p: Params = [];
  if (f.status === "ouvertes") where.push("a.status IN ('nouvelle','en_etude','complement')");
  else if (f.status) (where.push("a.status = ?"), p.push(f.status));
  if (f.offer) (where.push("a.offer = ?"), p.push(f.offer));
  if (f.assigned === "moi") (where.push("a.assigned_to = ?"), p.push(adminId));
  if (f.assigned === "personne") where.push("a.assigned_to IS NULL");
  if (f.q) {
    where.push("(a.reference LIKE ? OR a.nom LIKE ? OR a.prenom LIKE ? OR a.email LIKE ? OR a.ville LIKE ?)");
    const like = `%${f.q}%`;
    p.push(like, like, like, like, like);
  }
  return { sql: where.length ? `WHERE ${where.join(" AND ")}` : "", p };
}

const APP_SORT: Record<string, string> = {
  recent: "a.created_at DESC",
  ancien: "a.created_at ASC",
  maj: "a.updated_at DESC",
  nom: "a.nom COLLATE NOCASE ASC",
};

export function listApplications(f: AppFilters, adminId: number) {
  const { sql, p } = appWhere(f, adminId);
  const total = get<{ n: number }>(`SELECT COUNT(*) n FROM applications a ${sql}`, ...p)!.n;
  const page = Math.max(1, f.page ?? 1);
  const rows = all<QueueRow & { email: string; ville: string; updated_at: string; docs: number }>(
    `SELECT a.id, a.reference, a.prenom, a.nom, a.email, a.ville, a.offer, a.status, a.created_at, a.updated_at, ad.name assignee,
            (SELECT COUNT(*) FROM documents d WHERE d.application_id = a.id) docs
       FROM applications a LEFT JOIN admins ad ON ad.id = a.assigned_to
       ${sql} ORDER BY ${APP_SORT[f.sort ?? ""] ?? APP_SORT.recent} LIMIT ? OFFSET ?`,
    ...p,
    PAGE_SIZE,
    (page - 1) * PAGE_SIZE,
  );
  const counts = Object.fromEntries(
    all<{ status: string; n: number }>("SELECT status, COUNT(*) n FROM applications GROUP BY status").map((r) => [r.status, r.n]),
  ) as Record<string, number>;
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)), counts };
}

export function exportApplications(f: AppFilters, adminId: number) {
  const { sql, p } = appWhere(f, adminId);
  return all<Record<string, string | number | null>>(
    `SELECT a.reference, a.status, a.offer, a.civilite, a.prenom, a.nom, a.email, a.telephone, a.ville, a.pays, a.profession,
            a.revenus, a.patrimoine, ad.name assigne_a, a.created_at, a.decided_at
       FROM applications a LEFT JOIN admins ad ON ad.id = a.assigned_to ${sql} ORDER BY a.created_at DESC`,
    ...p,
  );
}

export type ApplicationDetail = Record<string, string | number | null> & {
  id: number;
  reference: string;
  status: string;
  offer: string;
  assigned_to: number | null;
  member_id: number | null;
  created_at: string;
};

export function getApplication(id: number) {
  const app = get<ApplicationDetail>("SELECT * FROM applications WHERE id = ?", id);
  if (!app) return null;
  return {
    app,
    documents: all<{ id: number; kind: string; original_name: string; mime: string; size: number; uploaded_by: string; uploaded_at: string }>(
      "SELECT id, kind, original_name, mime, size, uploaded_by, uploaded_at FROM documents WHERE application_id = ? ORDER BY uploaded_at",
      id,
    ),
    notes: notesFor("application", id),
    events: eventsFor("application", id),
    team: all<{ id: number; name: string }>("SELECT id, name FROM admins WHERE active = 1 ORDER BY name"),
    member: app.member_id ? get<{ id: number; member_number: string }>("SELECT id, member_number FROM members WHERE id = ?", app.member_id) : null,
    duplicates: all<{ id: number; reference: string; status: string; created_at: string }>(
      "SELECT id, reference, status, created_at FROM applications WHERE email = ? AND id != ? ORDER BY created_at DESC",
      app.email as string,
      id,
    ),
  };
}

function notesFor(type: string, id: number) {
  return all<{ id: number; body: string; created_at: string; admin_name: string | null }>(
    `SELECT n.id, n.body, n.created_at, ad.name admin_name FROM notes n LEFT JOIN admins ad ON ad.id = n.admin_id
      WHERE n.entity_type = ? AND n.entity_id = ? ORDER BY n.created_at DESC`,
    type,
    id,
  );
}

function eventsFor(type: string, id: number) {
  return all<EventRow>(
    `SELECT e.*, ad.name admin_name FROM events e LEFT JOIN admins ad ON ad.id = e.actor_id AND e.actor_type = 'admin'
      WHERE e.entity_type = ? AND e.entity_id = ? ORDER BY e.created_at DESC, e.id DESC`,
    type,
    id,
  );
}

/* ───────────── Members ───────────── */

export type MemberFilters = { status?: string; offer?: string; card?: string; q?: string; page?: number };

function memberWhere(f: MemberFilters) {
  const where: string[] = [];
  const p: Params = [];
  if (f.status) (where.push("status = ?"), p.push(f.status));
  if (f.offer) (where.push("offer = ?"), p.push(f.offer));
  if (f.card) (where.push("card_status = ?"), p.push(f.card));
  if (f.q) {
    where.push("(member_number LIKE ? OR nom LIKE ? OR prenom LIKE ? OR email LIKE ?)");
    const like = `%${f.q}%`;
    p.push(like, like, like, like);
  }
  return { sql: where.length ? `WHERE ${where.join(" AND ")}` : "", p };
}

export type MemberRow = {
  id: number;
  member_number: string;
  civilite: string | null;
  prenom: string;
  nom: string;
  email: string;
  telephone: string | null;
  ville: string | null;
  pays: string | null;
  offer: string;
  status: string;
  card_status: string;
  card_last4: string;
  application_id: number | null;
  created_at: string;
  updated_at: string;
};

export function listMembers(f: MemberFilters) {
  const { sql, p } = memberWhere(f);
  const total = get<{ n: number }>(`SELECT COUNT(*) n FROM members ${sql}`, ...p)!.n;
  const page = Math.max(1, f.page ?? 1);
  const rows = all<MemberRow>(`SELECT * FROM members ${sql} ORDER BY created_at DESC LIMIT ? OFFSET ?`, ...p, PAGE_SIZE, (page - 1) * PAGE_SIZE);
  const counts = Object.fromEntries(
    all<{ status: string; n: number }>("SELECT status, COUNT(*) n FROM members GROUP BY status").map((r) => [r.status, r.n]),
  ) as Record<string, number>;
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)), counts };
}

export function exportMembers(f: MemberFilters) {
  const { sql, p } = memberWhere(f);
  return all<Record<string, string | number | null>>(
    `SELECT member_number, status, offer, card_status, civilite, prenom, nom, email, telephone, ville, pays, created_at FROM members ${sql} ORDER BY created_at DESC`,
    ...p,
  );
}

export function getMember(id: number) {
  const member = get<MemberRow>("SELECT * FROM members WHERE id = ?", id);
  if (!member) return null;
  return {
    member,
    application: member.application_id
      ? get<{ id: number; reference: string; profession: string; revenus: string; patrimoine: string }>(
          "SELECT id, reference, profession, revenus, patrimoine FROM applications WHERE id = ?",
          member.application_id,
        )
      : null,
    notes: notesFor("member", id),
    events: eventsFor("member", id),
  };
}

/* ───────────── Team & journal ───────────── */

export function listAdmins() {
  return all<{
    id: number;
    email: string;
    name: string;
    role: string;
    active: number;
    must_change_password: number;
    created_at: string;
    last_login_at: string | null;
    open_apps: number;
  }>(
    `SELECT a.id, a.email, a.name, a.role, a.active, a.must_change_password, a.created_at, a.last_login_at,
            (SELECT COUNT(*) FROM applications x WHERE x.assigned_to = a.id AND x.status IN ('nouvelle','en_etude','complement')) open_apps
       FROM admins a ORDER BY a.active DESC, a.name`,
  );
}

export function listEvents(f: { type?: string; admin?: string; page?: number }) {
  const where: string[] = [];
  const p: Params = [];
  if (f.type) (where.push("e.entity_type = ?"), p.push(f.type));
  if (f.admin) (where.push("e.actor_type = 'admin' AND e.actor_id = ?"), p.push(Number(f.admin)));
  const sql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const total = get<{ n: number }>(`SELECT COUNT(*) n FROM events e ${sql}`, ...p)!.n;
  const page = Math.max(1, f.page ?? 1);
  const size = 50;
  const rows = all<EventRow>(
    `SELECT e.*, ad.name admin_name FROM events e LEFT JOIN admins ad ON ad.id = e.actor_id AND e.actor_type = 'admin'
      ${sql} ORDER BY e.created_at DESC, e.id DESC LIMIT ? OFFSET ?`,
    ...p,
    size,
    (page - 1) * size,
  );
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / size)) };
}
