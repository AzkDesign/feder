import { SettingsForm } from "./form";
import { Card, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/server/auth";
import { getSettings } from "@/lib/server/db";

export const metadata = { title: "Paramètres" };

export default async function ParametresPage() {
  await requireAdmin("super_admin");
  const s = getSettings();
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Paramètres" subtitle="Réglages généraux de Feder." />
      <Card>
        <SettingsForm settings={s} demo={process.env.NODE_ENV !== "production"} />
      </Card>
    </div>
  );
}
