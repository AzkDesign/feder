import "server-only";
import { headers } from "next/headers";
import { now, run } from "./db";

export type EntityType = "application" | "member" | "admin" | "settings" | "auth";

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

/**
 * Append-only journal. `public` events are also shown to the applicant on the tracking page.
 */
export async function logEvent(e: {
  entityType: EntityType;
  entityId?: number | null;
  actorType: "admin" | "candidat" | "membre" | "systeme";
  actorId?: number | null;
  action: string;
  detail?: string | null;
  public?: boolean;
}) {
  run(
    "INSERT INTO events (entity_type, entity_id, actor_type, actor_id, action, detail, public, ip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    e.entityType,
    e.entityId ?? null,
    e.actorType,
    e.actorId ?? null,
    e.action,
    e.detail ?? null,
    e.public ? 1 : 0,
    await clientIp(),
    now(),
  );
}
