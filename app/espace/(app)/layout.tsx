import { memberLogout } from "../actions";
import { RevealObserver } from "@/components/motion/RevealObserver";
import { SalonNav } from "@/components/salon/Nav";
import { ensureAccount, settleCashback } from "@/lib/server/banking";
import { get } from "@/lib/server/db";
import { requireMember } from "@/lib/server/member-auth";

export const dynamic = "force-dynamic";

export default async function SalonLayout({ children }: { children: React.ReactNode }) {
  const m = await requireMember();
  ensureAccount(m.id);
  settleCashback(m.id);
  const { n } = get<{ n: number }>(
    "SELECT COUNT(*) n FROM concierge_messages WHERE member_id = ? AND sender = 'admin' AND read_at IS NULL",
    m.id,
  )!;

  return (
    <>
      <SalonNav member={m} unread={n} logout={memberLogout} />
      <div className="lg:pl-[260px] print:pl-0">
        <main className="mx-auto max-w-[1180px] px-4 pb-32 pt-6 md:px-8 md:pt-10 lg:pb-16">{children}</main>
      </div>
      <RevealObserver />
    </>
  );
}
