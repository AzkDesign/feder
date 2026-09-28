import { revokeOtherSessions } from "../../actions";
import { PasswordForm, RecoveryForm } from "./forms";
import { Panel, SalonTitle } from "@/components/salon/ui";
import { actionLabel } from "@/lib/labels";
import { all, get } from "@/lib/server/db";
import { requireMember } from "@/lib/server/member-auth";

export const metadata = { title: "Sécurité" };

function device(ua: string | null) {
  if (!ua) return "Appareil inconnu";
  const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : "Linux";
  const br = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Navigateur";
  return `${br} · ${os}`;
}

export default async function SecuritePage() {
  const m = await requireMember();
  const sessions = all<{ token_hash: string; created_at: string; last_seen_at: string | null; ip: string | null; user_agent: string | null }>(
    "SELECT token_hash, created_at, last_seen_at, ip, user_agent FROM member_sessions WHERE member_id = ? AND mfa_ok = 1 AND expires_at > ? ORDER BY last_seen_at DESC",
    m.id,
    new Date().toISOString(),
  );
  const codes = get<{ recovery_codes: string | null }>("SELECT recovery_codes FROM members WHERE id = ?", m.id)!;
  const left = codes.recovery_codes ? (JSON.parse(codes.recovery_codes) as string[]).length : 0;
  const history = all<{ action: string; ip: string | null; created_at: string }>(
    `SELECT action, ip, created_at FROM events WHERE entity_type = 'member' AND entity_id = ?
       AND action IN ('membre_connexion','membre_connexion_echouee','membre_2fa_echouee','mot_de_passe_membre','codes_secours','sessions_revoquees','espace_active')
     ORDER BY id DESC LIMIT 12`,
    m.id,
  );
  const fmt = (iso: string | null) =>
    iso ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : "—";

  return (
    <div>
      <SalonTitle eyebrow="Protection de votre compte" title="Sécurité" />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Double authentification", "Activée", true],
          ["Codes de secours restants", `${left} / 8`, left > 2],
          ["Appareils connectés", String(sessions.length), true],
        ].map(([k, v, good]) => (
          <div key={k as string} className="s-card p-5">
            <div className="text-xs text-[var(--s-muted)]">{k}</div>
            <div className={`mt-2 font-display text-2xl font-semibold ${good ? "" : "text-[#ffb4a8]"}`}>{v}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Appareils connectés"
          action={
            sessions.length > 1 ? (
              <form action={revokeOtherSessions}>
                <button className="text-sm text-gold-light hover:underline">Déconnecter les autres</button>
              </form>
            ) : null
          }
        >
          <ul className="divide-y divide-[var(--s-line)]">
            {sessions.map((s) => (
              <li key={s.token_hash} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <div>
                    {device(s.user_agent)} {s.token_hash === m.token_hash && <span className="ml-1 text-xs text-gold-light">· cet appareil</span>}
                  </div>
                  <div className="text-xs text-[var(--s-muted)]">
                    {s.ip} · actif {fmt(s.last_seen_at)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Historique de connexion">
          <ul className="space-y-3 text-sm">
            {history.map((h, i) => (
              <li key={i} className="flex justify-between gap-4">
                <span className={h.action.includes("echouee") ? "text-[#ffb4a8]" : ""}>{actionLabel[h.action] ?? h.action}</span>
                <span className="shrink-0 text-xs text-[var(--s-muted)]">
                  {fmt(h.created_at)} · {h.ip}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Changer de mot de passe">
          <PasswordForm />
        </Panel>

        <Panel title="Codes de secours">
          <RecoveryForm />
        </Panel>
      </div>
    </div>
  );
}
