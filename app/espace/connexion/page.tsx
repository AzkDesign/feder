import { redirect } from "next/navigation";
import { LoginForm } from "./form";
import { AuthShell } from "@/components/salon/AuthShell";
import { getMemberSession } from "@/lib/server/member-auth";

export const metadata = { title: "Connexion" };
export const dynamic = "force-dynamic";

export default async function ConnexionPage({ searchParams }: { searchParams: Promise<{ "au-revoir"?: string; expiree?: string }> }) {
  const s = await getMemberSession();
  if (s?.mfa_ok) redirect("/espace");
  const sp = await searchParams;
  return (
    <AuthShell
      title={sp["au-revoir"] ? "À bientôt." : "Bon retour."}
      subtitle={sp.expiree ? "Votre session a expiré par sécurité. Reconnectez-vous." : "Accédez à votre espace membre Feder."}
    >
      <LoginForm />
    </AuthShell>
  );
}
