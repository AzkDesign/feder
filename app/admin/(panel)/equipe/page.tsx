import { updateAdmin } from "../../actions";
import { CreateAdminForm, ResetPasswordButton } from "./forms";
import { Submit } from "@/components/admin/client";
import { Badge, Card, Flash, PageHeader, btn, inputCls } from "@/components/admin/ui";
import { fmtDate, roleLabel } from "@/lib/labels";
import { listAdmins } from "@/lib/server/admin-data";
import { requireAdmin } from "@/lib/server/auth";

export const metadata = { title: "Équipe" };

export default async function EquipePage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const me = await requireAdmin("super_admin");
  const { ok, erreur } = await searchParams;
  const admins = listAdmins();

  return (
    <div className="space-y-6">
      <PageHeader title="Équipe" subtitle="Comptes ayant accès à l'administration." />
      <Flash ok={ok} erreur={erreur} />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card pad={false}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-[0.08em] text-muted">
                  <th className="px-5 py-3 font-medium">Nom</th>
                  <th className="px-3 py-3 font-medium">Rôle et statut</th>
                  <th className="px-3 py-3 font-medium">Dossiers ouverts</th>
                  <th className="px-3 py-3 font-medium">Dernière connexion</th>
                  <th className="px-5 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {admins.map((a) => (
                  <tr key={a.id} className={a.active ? "" : "opacity-60"}>
                    <td className="px-5 py-3">
                      <div className="font-medium">
                        {a.name} {a.id === me.id && <span className="text-xs text-muted">(vous)</span>}
                      </div>
                      <div className="text-xs text-muted">{a.email}</div>
                      {a.must_change_password ? <div className="mt-1 text-xs text-[#8a5a00]">Mot de passe provisoire</div> : null}
                    </td>
                    <td className="px-3 py-3">
                      {a.id === me.id ? (
                        <Badge tone="good">{roleLabel[a.role as keyof typeof roleLabel]}</Badge>
                      ) : (
                        <form action={updateAdmin} className="flex items-center gap-2">
                          <input type="hidden" name="id" value={a.id} />
                          <select name="role" defaultValue={a.role} className={`${inputCls} w-auto`} aria-label="Rôle">
                            <option value="analyste">Analyste</option>
                            <option value="super_admin">Super admin</option>
                          </select>
                          <select name="active" defaultValue={String(a.active)} className={`${inputCls} w-auto`} aria-label="Statut">
                            <option value="1">Actif</option>
                            <option value="0">Désactivé</option>
                          </select>
                          <Submit className={btn.ghost}>OK</Submit>
                        </form>
                      )}
                    </td>
                    <td className="px-3 py-3 tabular-nums">{a.open_apps}</td>
                    <td className="px-3 py-3 text-muted">{a.last_login_at ? fmtDate(a.last_login_at, true) : "Jamais"}</td>
                    <td className="px-5 py-3 text-right">{a.id !== me.id && <ResetPasswordButton id={a.id} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card title="Ajouter un membre de l'équipe">
            <CreateAdminForm />
          </Card>
          <Card title="Rôles">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-medium">Analyste</dt>
                <dd className="text-muted">Traite les demandes, gère les membres et leurs cartes, ajoute des notes.</dd>
              </div>
              <div>
                <dt className="font-medium">Super admin</dt>
                <dd className="text-muted">Tout ce que fait un analyste, plus : équipe, paramètres, journal d'audit, clôture de comptes, réouverture de dossiers.</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
