import Link from "next/link";
import { notFound } from "next/navigation";
import { conciergeReply } from "../../../salon-actions";
import { Submit } from "@/components/admin/client";
import { Card, btn, textareaCls } from "@/components/admin/ui";
import { fmtDate, offerLabel, type Offer } from "@/lib/labels";
import { requireAdmin } from "@/lib/server/auth";
import { all, get } from "@/lib/server/db";

export const metadata = { title: "Conversation" };

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const m = get<{ id: number; prenom: string; nom: string; member_number: string; offer: string; email: string; telephone: string | null }>(
    "SELECT id, prenom, nom, member_number, offer, email, telephone FROM members WHERE id = ?",
    Number(id),
  );
  if (!m) notFound();
  const messages = all<{ id: number; sender: string; body: string; created_at: string; admin_name: string | null; read_at: string | null }>(
    `SELECT cm.id, cm.sender, cm.body, cm.created_at, cm.read_at, a.name admin_name
       FROM concierge_messages cm LEFT JOIN admins a ON a.id = cm.admin_id WHERE cm.member_id = ? ORDER BY cm.id`,
    m.id,
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/conciergerie" className="text-sm text-muted hover:text-ink">
          ← Conciergerie
        </Link>
        <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight">
          {m.prenom} {m.nom}
        </h1>
        <p className="text-sm text-muted">
          <Link href={`/admin/membres/${m.id}`} className="text-gold-deep hover:underline">
            {m.member_number}
          </Link>{" "}
          · {offerLabel[m.offer as Offer]} · {m.email} {m.telephone && `· ${m.telephone}`}
        </p>
      </div>

      <Card>
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "admin" ? "justify-end" : ""}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${msg.sender === "admin" ? "bg-ink text-white" : "bg-mist"}`}>
                <p className="whitespace-pre-line break-words">{msg.body}</p>
                <div className={`mt-1 text-[11px] ${msg.sender === "admin" ? "text-white/50" : "text-muted"}`}>
                  {msg.sender === "admin" ? `${msg.admin_name ?? "Concierge"} · ` : ""}
                  {fmtDate(msg.created_at, true)}
                  {msg.sender === "admin" && (msg.read_at ? " · lu" : " · non lu")}
                </div>
              </div>
            </div>
          ))}
        </div>
        <form action={conciergeReply} className="mt-6 space-y-2 border-t border-line pt-5">
          <input type="hidden" name="memberId" value={m.id} />
          <textarea name="body" rows={3} required className={textareaCls} placeholder={`Répondre à ${m.prenom}…`} />
          <Submit className={btn.primary}>Envoyer</Submit>
        </form>
      </Card>
    </div>
  );
}
