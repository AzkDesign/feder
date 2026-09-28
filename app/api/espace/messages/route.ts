import { NextResponse } from "next/server";
import { all, now, run } from "@/lib/server/db";
import { getMemberSession } from "@/lib/server/member-auth";

/** Polled by the concierge chat: new messages after `after`, marks concierge replies as read. */
export async function GET(req: Request) {
  const m = await getMemberSession();
  if (!m || !m.mfa_ok) return NextResponse.json({ error: "Session expirée" }, { status: 401 });
  const after = Number(new URL(req.url).searchParams.get("after")) || 0;
  const rows = all<{ id: number; sender: string; body: string; created_at: string }>(
    "SELECT id, sender, body, created_at FROM concierge_messages WHERE member_id = ? AND id > ? ORDER BY id",
    m.id,
    after,
  );
  run("UPDATE concierge_messages SET read_at = ? WHERE member_id = ? AND sender = 'admin' AND read_at IS NULL", now(), m.id);
  return NextResponse.json({ messages: rows }, { headers: { "Cache-Control": "no-store" } });
}
