import Link from "next/link";
import { CountUp } from "@/components/motion/CountUp";
import { BalanceChart } from "@/components/salon/BalanceChart";
import { CardStage } from "@/components/salon/CardStage";
import { Panel, QuickAction, TxList } from "@/components/salon/ui";
import { categories, fmtCents, offerRules, upcomingEvents, vaultIcons } from "@/lib/banking-labels";
import {
  balanceSeries,
  ensureAccount,
  monthCashbackPreview,
  recentTransactions,
  spendingByCategory,
  vaultsOf,
} from "@/lib/server/banking";
import { all, get } from "@/lib/server/db";
import { requireMember } from "@/lib/server/member-auth";

export const metadata = { title: "Accueil" };

export default async function SalonHome() {
  const m = await requireMember();
  const acc = ensureAccount(m.id);
  const series = balanceSeries(m.id);
  const delta = series[series.length - 1].b - series[0].b;
  const spending = spendingByCategory(m.id);
  const spentTotal = spending.reduce((n, s) => n + s.total, 0);
  const cb = monthCashbackPreview(m.id, m.offer);
  const vaults = vaultsOf(m.id);
  const saved = vaults.reduce((n, v) => n + v.balance_cents, 0);
  const lastMsg = get<{ body: string; sender: string; created_at: string }>(
    "SELECT body, sender, created_at FROM concierge_messages WHERE member_id = ? ORDER BY id DESC LIMIT 1",
    m.id,
  );
  const rsvps = new Set(all<{ event_key: string }>("SELECT event_key FROM event_rsvps WHERE member_id = ?", m.id).map((r) => r.event_key));
  const nextEvent = upcomingEvents.find((e) => (e.tiers as readonly string[]).includes(m.offer) && new Date(e.date) > new Date());
  const h = new Date().getHours();
  const hello = h < 5 ? "Bonne nuit" : h < 18 ? "Bonjour" : "Bonsoir";
  const rate = offerRules[m.offer].cashbackBps / 100;

  return (
    <div className="space-y-6">
      <div data-reveal>
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold-light/75">
          {new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}
        </div>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
          {hello}, {m.prenom}.
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <section data-reveal className="s-card relative overflow-hidden p-6 md:p-8" style={{ "--d": "80ms" } as React.CSSProperties}>
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(212,175,55,0.18), transparent 65%)" }} aria-hidden="true" />
          <div className="relative">
            <div className="text-sm text-[var(--s-muted)]">Solde disponible</div>
            <div className="mt-2 font-display text-[clamp(2.4rem,6vw,3.8rem)] font-semibold leading-none tracking-[-0.04em]">
              <CountUp value={acc.balance_cents / 100} decimals={2} suffix=" €" duration={1600} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className={delta >= 0 ? "text-[#8fd6a8]" : "text-[#ff9b8a]"}>
                {delta >= 0 ? "▲" : "▼"} {fmtCents(Math.abs(delta))} sur 30 jours
              </span>
              {saved > 0 && <span className="text-[var(--s-muted)]">+ {fmtCents(saved)} dans vos coffres</span>}
            </div>
            <div className="mt-6">
              <BalanceChart data={series} />
            </div>
            <div className="mt-6 grid grid-cols-4 gap-2">
              <QuickAction href="/espace/virements?mode=feder" label="Feder Pay" icon="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
              <QuickAction href="/espace/virements" label="Virement" icon="M4 12h16M14 6l6 6-6 6" />
              <QuickAction href="/espace/coffres" label="Épargner" icon={vaultIcons.star} />
              <QuickAction href="/espace/documents" label="RIB" icon="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5" />
            </div>
          </div>
        </section>

        <section data-reveal className="s-card p-6 md:p-8" style={{ "--d": "160ms" } as React.CSSProperties}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-medium text-white/80">Ma carte</h2>
            <Link href="/espace/carte" className="text-sm text-gold-light hover:underline">
              Réglages
            </Link>
          </div>
          <CardStage variant={m.offer} holder={`${m.prenom[0]}. ${m.nom}`.toUpperCase()} last4={m.card_last4} cardStatus={m.card_status} />
        </section>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Panel title="Cashback du mois" className="md:col-span-1">
          <div className="font-display text-4xl font-semibold tracking-tight text-gold-grad">
            <CountUp value={cb.cashback / 100} decimals={2} suffix=" €" />
          </div>
          <p className="mt-2 text-sm text-[var(--s-muted)]">
            {rate.toLocaleString("fr-FR")} % sur {fmtCents(cb.spent)} de paiements. Versé le 1er du mois prochain.
          </p>
        </Panel>

        <Panel title="Dépenses du mois" className="md:col-span-2" action={<Link href="/espace/operations" className="text-sm text-gold-light hover:underline">Détail</Link>}>
          {spending.length === 0 ? (
            <p className="text-sm text-[var(--s-muted)]">Aucune dépense carte ce mois-ci.</p>
          ) : (
            <ul className="space-y-3">
              {spending.slice(0, 5).map((s) => (
                <li key={s.category}>
                  <div className="flex justify-between text-sm">
                    <span>{categories[s.category]?.label ?? s.category}</span>
                    <span className="font-mono tabular-nums text-white/80">{fmtCents(s.total)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-white/[0.06]">
                    <div className="h-1.5 rounded-full bg-gradient-to-r from-[#8c6b12] to-[#e8cd7a]" style={{ width: `${Math.max(3, (s.total / spentTotal) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <Panel title="Dernières opérations" action={<Link href="/espace/operations" className="text-sm text-gold-light hover:underline">Tout voir</Link>}>
          <TxList rows={recentTransactions(m.id, 7)} />
        </Panel>

        <div className="space-y-6">
          <Panel title="Mes coffres" action={<Link href="/espace/coffres" className="text-sm text-gold-light hover:underline">Gérer</Link>}>
            {vaults.length === 0 ? (
              <Link href="/espace/coffres" className="block rounded-2xl border border-dashed border-[var(--s-line)] p-5 text-center text-sm text-[var(--s-muted)] hover:border-gold/40">
                Créez votre premier coffre pour épargner vers un projet.
              </Link>
            ) : (
              <ul className="space-y-4">
                {vaults.slice(0, 3).map((v) => {
                  const pct = Math.min(100, Math.round((v.balance_cents / v.target_cents) * 100));
                  return (
                    <li key={v.id}>
                      <div className="flex justify-between text-sm">
                        <span>{v.name}</span>
                        <span className="text-[var(--s-muted)]">{pct} %</span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-white/[0.06]">
                        <div className="h-1.5 rounded-full bg-gold" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Link href="/espace/conciergerie" className="s-card group block p-6 transition-colors hover:border-gold/30">
            <div className="flex items-center gap-3">
              <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 text-gold-light">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <path d="M4 18h16M6 18v-3a6 6 0 0 1 12 0v3M12 9V7M10 21h4" strokeLinecap="round" />
                </svg>
                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[var(--s-surface)] bg-[#6fcf97]" />
              </span>
              <div>
                <div className="font-medium">Votre conciergerie</div>
                <div className="text-xs text-[var(--s-muted)]">{m.offer === "gold" ? "Disponible en semaine" : "Disponible 24h/24"}</div>
              </div>
            </div>
            <p className="mt-4 line-clamp-2 text-sm text-white/70">
              {lastMsg ? `${lastMsg.sender === "admin" ? "Concierge : " : "Vous : "}${lastMsg.body}` : "Une table, un billet, un cadeau ? Écrivez-nous, nous nous occupons de tout."}
            </p>
          </Link>

          {nextEvent && (
            <Link href="/espace/privileges" className="s-card block p-6 transition-colors hover:border-gold/30">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold-light/75">Prochain événement</div>
              <div className="mt-2 font-display text-xl font-semibold tracking-tight">{nextEvent.title}</div>
              <div className="mt-1 text-sm text-[var(--s-muted)]">
                {new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(new Date(nextEvent.date))} · {nextEvent.place}
              </div>
              {rsvps.has(nextEvent.key) && <div className="mt-3 text-sm text-gold-light">✓ Vous êtes inscrit</div>}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
