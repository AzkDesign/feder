import { redirect } from "next/navigation";
import { VerifyForm } from "./form";
import { AuthShell } from "@/components/salon/AuthShell";
import { getMemberSession } from "@/lib/server/member-auth";

export const metadata = { title: "Vérification" };
export const dynamic = "force-dynamic";

export default async function VerificationPage() {
  const s = await getMemberSession();
  if (!s) redirect("/espace/connexion");
  if (s.mfa_ok) redirect("/espace");
  return (
    <AuthShell title={`Bonjour ${s.prenom}.`} subtitle="Saisissez le code affiché dans votre application d'authentification.">
      <VerifyForm />
    </AuthShell>
  );
}
