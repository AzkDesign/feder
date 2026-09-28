import Link from "next/link";
import { ActivationFlow } from "./flow";
import { AuthShell } from "@/components/salon/AuthShell";
import { memberForActivation } from "@/lib/server/member-auth";

export const metadata = { title: "Activation" };
export const dynamic = "force-dynamic";

export default async function ActivationPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const m = memberForActivation(token);

  if (!m) {
    return (
      <AuthShell title="Lien expiré." subtitle="Ce lien d'activation n'est plus valide ou a déjà été utilisé.">
        <Link href="/suivi" className="btn btn-gold btn-lg w-full">
          <span>Obtenir un nouveau lien</span>
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={`Bienvenue, ${m.prenom}.`} subtitle={`Membre ${m.member_number}. Deux étapes pour sécuriser votre accès.`}>
      <ActivationFlow token={token} memberNumber={m.member_number} />
    </AuthShell>
  );
}
