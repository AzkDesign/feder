import { logEvent } from "@/lib/server/audit";
import { getAdmin } from "@/lib/server/auth";
import { readDocument } from "@/lib/server/storage";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin || admin.must_change_password) return new Response("Non autorisé", { status: 401 });

  const { id } = await params;
  const doc = readDocument(Number(id));
  if (!doc) return new Response("Document introuvable", { status: 404 });

  await logEvent({
    entityType: "application", entityId: doc.application_id, actorType: "admin", actorId: admin.id,
    action: "document_consulte", detail: doc.original_name,
  });

  return new Response(new Uint8Array(doc.data), {
    headers: {
      "Content-Type": doc.mime,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(doc.original_name)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
