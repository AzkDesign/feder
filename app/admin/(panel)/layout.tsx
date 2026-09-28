import { redirect } from "next/navigation";
import { Sidebar } from "@/components/admin/client";
import { logoutAction } from "../actions";
import { getAdmin } from "@/lib/server/auth";
import { get } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/connexion");
  const { n } = get<{ n: number }>("SELECT COUNT(*) n FROM applications WHERE status IN ('nouvelle','en_etude','complement')")!;
  // Threads whose latest message comes from the member = awaiting a reply.
  const { c } = get<{ c: number }>(
    `SELECT COUNT(*) c FROM concierge_messages cm
      WHERE cm.id IN (SELECT MAX(id) FROM concierge_messages GROUP BY member_id) AND cm.sender = 'member'`,
  )!;

  return (
    <>
      <Sidebar admin={admin} pending={n} concierge={c} logout={logoutAction} />
      <div className="lg:pl-64">
        <main className="mx-auto max-w-[1400px] px-4 py-8 md:px-8 md:py-10">{children}</main>
      </div>
    </>
  );
}
