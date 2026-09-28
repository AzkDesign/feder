import "server-only";
import { all, get } from "./db";

export type PublicApplication = {
  id: number;
  reference: string;
  status: string;
  offer: string;
  prenom: string;
  public_message: string | null;
  created_at: string;
  updated_at: string;
};

/** Look up an application for the applicant: reference AND e-mail must both match. */
export function findForApplicant(reference: string, email: string) {
  return get<PublicApplication>(
    `SELECT id, reference, status, offer, prenom, public_message, created_at, updated_at
       FROM applications WHERE reference = ? AND email = ?`,
    reference.trim().toUpperCase(),
    email.trim(),
  );
}

export function publicTimeline(applicationId: number) {
  return all<{ action: string; detail: string | null; actor_type: string; created_at: string }>(
    `SELECT action, detail, actor_type, created_at FROM events
      WHERE entity_type = 'application' AND entity_id = ? AND public = 1 ORDER BY created_at ASC, id ASC`,
    applicationId,
  );
}
