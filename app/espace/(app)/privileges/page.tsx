import { createHmac } from "node:crypto";
import Link from "next/link";
import QRCode from "qrcode";
import { toggleRsvp } from "../../actions";
import { Panel, SalonTitle } from "@/components/salon/ui";
import { offerRules, upcomingEvents } from "@/lib/banking-labels";
import { all } from "@/lib/server/db";
import { requireMember } from "@/lib/server/member-auth";

export const metadata = { title: "Privilèges" };

const perks: { title: string; text: string; tiers: string[] }[] = [
  { title: "Cashback", text: "Sur chaque paiement carte, versé automatiquement chaque mois.", tiers: ["gold", "platine", "noire"] },
  { title: "Salons d'aéroport", text: "Plus de 1 300 salons dans le monde. Présentez votre passe.", tiers: ["platine", "noire"] },
  { title: "Invités en salon", text: "Jusqu'à deux accompagnants avec vous.", tiers: ["noire"] },
  { title: "Assurance voyage", text: "Annulation, bagages, frais médicaux, location de véhicule.", tiers: ["gold", "platine", "noire"] },
  { title: "Conciergerie 24/7", text: "Réservations, billetterie, cadeaux, tout ce qui compte.", tiers: ["platine", "noire"] },
  { title: "Événements privés", text: "Avant-premières, dîners de chefs, rencontres réservées.", tiers: ["gold", "platine", "noire"] },
];

export default async function PrivilegesPage() {
  const m = await requireMember();
  const rules = offerRules[m.offer];
  const day = new Date().toISOString().slice(0, 10);
  const sig = createHmac("sha256", process.env.STORAGE_KEY ?? "feder").update(`${m.member_number}|${day}`).digest("hex").slice(0, 12);
  const pass = `FEDER-LOUNGE|${m.member_number}|${day}|${sig}`;
  const qr = rules.lounge ? await QRCode.toString(pass, { type: "svg", margin: 0, color: { dark: "#0b0b0c", light: "#00000000" } }) : null;
  const rsvps = new Map(all<{ event_key: string; guests: number }>("SELECT event_key, guests FROM event_rsvps WHERE member_id = ?", m.id).map((r) => [r.event_key, r.guests]));
  const events = upcomingEvents.filter((e) => new Date(e.date) > new Date());

  return (
    <div>
      <SalonTitle eyebrow="Réservé aux membres" title="Privilèges" />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <section data-reveal className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#b8912a] via-[#f5e6b8] to-[#c9a233] p-6 text-ink shadow-[0_30px_60px_-30px_rgba(212,175,55,0.6)] md:p-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono text-[11px] tracking-[0.24em] opacity-70">PASSE SALON</div>
              <div className="mt-1 font-display text-2xl font-semibold tracking-tight">
                {m.prenom} {m.nom}
              </div>
              <div className="font-mono text-xs opacity-70">{m.member_number}</div>
            </div>
            <span className="font-display text-lg font-semibold tracking-[0.3em]">FEDER</span>
          </div>
          {qr ? (
            <>
              <div className="mx-auto mt-8 w-48 rounded-2xl bg-white/85 p-4 [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
              <p className="mt-4 text-center text-xs opacity-75">
                Valable aujourd'hui · {m.offer === "noire" ? "titulaire + 2 invités" : "titulaire"} · présentez-le à l'accueil du salon
              </p>
            </>
          ) : (
            <div className="mt-8 rounded-2xl bg-white/40 p-5 text-sm">
              L'accès aux salons d'aéroport est inclus à partir de Feder Platine.{" "}
              <Link href="/espace/conciergerie" className="font-semibold underline">
                Demander une évolution
              </Link>
            </div>
          )}
        </section>

        <Panel title="Vos avantages">
          <ul className="grid gap-4 sm:grid-cols-2">
            {perks.map((p) => {
              const on = p.tiers.includes(m.offer);
              return (
                <li key={p.title} className={on ? "" : "opacity-40"}>
                  <div className="flex items-center gap-2 font-medium">
                    <span className={on ? "text-gold-light" : ""}>{on ? "✦" : "○"}</span> {p.title}
                    {p.title === "Cashback" && <span className="text-gold-light">{(rules.cashbackBps / 100).toLocaleString("fr-FR")} %</span>}
                  </div>
                  <p className="mt-1 text-sm text-[var(--s-muted)]">{on ? p.text : "Disponible avec une offre supérieure."}</p>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <h2 className="mb-5 mt-12 font-display text-2xl font-semibold tracking-tight">Événements à venir</h2>
      <div className="grid gap-5 md:grid-cols-2">
        {events.map((e, i) => {
          const allowed = (e.tiers as readonly string[]).includes(m.offer);
          const going = rsvps.has(e.key);
          const d = new Date(e.date);
          return (
            <article key={e.key} data-reveal style={{ "--d": `${i * 80}ms` } as React.CSSProperties} className={`s-card flex gap-5 p-6 ${allowed ? "" : "opacity-55"}`}>
              <div className="w-16 shrink-0 text-center">
                <div className="font-display text-3xl font-semibold leading-none text-gold-light">{d.getDate()}</div>
                <div className="mt-1 text-xs uppercase tracking-wider text-[var(--s-muted)]">
                  {new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(d)}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-lg font-semibold tracking-tight">{e.title}</h3>
                <div className="text-xs text-[var(--s-muted)]">
                  {e.place} · {new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(d)} · {e.capacity} places
                </div>
                <p className="mt-2 text-sm text-white/70">{e.text}</p>
                {allowed ? (
                  <form action={toggleRsvp} className="mt-4 flex items-center gap-3">
                    <input type="hidden" name="event" value={e.key} />
                    {!going && m.offer !== "gold" && (
                      <select name="guests" className="s-input h-9 w-auto text-sm" aria-label="Invités">
                        <option value="0">Seul(e)</option>
                        <option value="1">+ 1 invité</option>
                        {m.offer === "noire" && <option value="2">+ 2 invités</option>}
                      </select>
                    )}
                    <button className={going ? "rounded-full border border-gold/40 px-4 py-2 text-sm text-gold-light" : "btn btn-gold btn-sm"}>
                      <span>{going ? `✓ Inscrit${rsvps.get(e.key) ? ` (+${rsvps.get(e.key)})` : ""} · Annuler` : "Je participe"}</span>
                    </button>
                  </form>
                ) : (
                  <div className="mt-4 text-xs text-[var(--s-muted)]">Réservé aux membres {e.tiers.includes("noire") && e.tiers.length === 1 ? "Noire" : "Platine et Noire"}.</div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
