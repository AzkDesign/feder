import { PasswordForm } from "./form";
import { Card, PageHeader } from "@/components/admin/ui";
import { roleLabel } from "@/lib/labels";
import { requireAdmin } from "@/lib/server/auth";

export const metadata = { title: "Mon compte" };

export default async function ComptePage({ searchParams }: { searchParams: Promise<{ premiere?: string }> }) {
  const admin = await requireAdmin(undefined, { allowPasswordChange: true });
  const { premiere } = await searchParams;
  return (
    <div className="max-w-xl space-y-6">
      <PageHeader title="Mon compte" subtitle={`${admin.name} · ${roleLabel[admin.role]} · ${admin.email}`} />
      {(premiere || admin.must_change_password) && (
        <div className="rounded-2xl bg-[#fbf1dc] px-4 py-3 text-sm text-[#8a5a00] ring-1 ring-inset ring-[#8a5a00]/15">
          Pour votre sécurité, choisissez un mot de passe personnel avant d'accéder à l'administration.
        </div>
      )}
      <Card title="Changer le mot de passe">
        <PasswordForm />
      </Card>
    </div>
  );
}
