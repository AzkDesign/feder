import { Chat } from "./chat";
import { SalonTitle } from "@/components/salon/ui";
import { all, now, run } from "@/lib/server/db";
import { requireMember } from "@/lib/server/member-auth";

export const metadata = { title: "Conciergerie" };

const ideas = [
  "Réserver une table ce soir pour deux",
  "Trouver deux places pour un concert complet",
  "Organiser un transfert depuis l'aéroport",
  "Faire livrer un bouquet demain matin",
];

export default async function ConciergeriePage() {
  const m = await requireMember();
  const messages = all<{ id: number; sender: string; body: string; created_at: string }>(
    "SELECT id, sender, body, created_at FROM concierge_messages WHERE member_id = ? ORDER BY id",
    m.id,
  );
  run("UPDATE concierge_messages SET read_at = ? WHERE member_id = ? AND sender = 'admin' AND read_at IS NULL", now(), m.id);

  return (
    <div>
      <SalonTitle eyebrow={m.offer === "gold" ? "Du lundi au vendredi, 9 h – 19 h" : "24 h/24 · 7 j/7"} title="Conciergerie" />
      <Chat initial={messages} prenom={m.prenom} ideas={ideas} />
    </div>
  );
}
