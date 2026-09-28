import { logEvent } from "@/lib/server/audit";
import { getAdmin } from "@/lib/server/auth";
import { exportApplications, exportMembers } from "@/lib/server/admin-data";

/** CSV cell: quote, escape quotes, and neutralise spreadsheet formula injection. */
function cell(v: unknown) {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(req: Request, { params }: { params: Promise<{ type: string }> }) {
  const admin = await getAdmin();
  if (!admin || admin.must_change_password) return new Response("Non autorisé", { status: 401 });

  const { type } = await params;
  const q = Object.fromEntries(new URL(req.url).searchParams);
  let rows: Record<string, unknown>[];
  if (type === "demandes") rows = exportApplications(q, admin.id);
  else if (type === "membres") rows = exportMembers(q);
  else return new Response("Export inconnu", { status: 404 });

  await logEvent({ entityType: "admin", entityId: admin.id, actorType: "admin", actorId: admin.id, action: "export", detail: `${type} · ${rows.length} lignes` });

  const headers = rows.length ? Object.keys(rows[0]) : ["aucune_donnee"];
  // BOM + ";" separator so Excel (FR) opens it correctly.
  const csv = "﻿" + [headers.map(cell).join(";"), ...rows.map((r) => headers.map((h) => cell(r[h])).join(";"))].join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="feder-${type}-${date}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
