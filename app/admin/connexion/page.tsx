import { redirect } from "next/navigation";
import { AdminLoginForm } from "./form";
import { Logo } from "@/components/Logo";
import { getAdmin } from "@/lib/server/auth";

export const metadata = { title: "Connexion" };
export const dynamic = "force-dynamic";

export default async function AdminLogin() {
  if (await getAdmin()) redirect("/admin");
  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink px-4">
      <div className="pointer-events-none fixed inset-0" style={{ background: "radial-gradient(circle at 70% 20%, rgba(212,175,55,0.18), transparent 50%)" }} aria-hidden="true" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo light />
        </div>
        <div className="rounded-3xl bg-white p-8 shadow-2xl">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Espace administration</h1>
          <p className="mt-1 text-sm text-muted">Accès réservé à l'équipe Feder.</p>
          <AdminLoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-white/40">Toutes les connexions sont journalisées.</p>
      </div>
    </div>
  );
}
