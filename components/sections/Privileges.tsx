import { IconBell, IconGift, IconPlane, IconShield, IconSpark, IconUser } from "@/components/Icons";
import { Reveal } from "@/components/ui";
import { privileges } from "@/lib/data";

const icons = {
  concierge: IconBell,
  lounge: IconPlane,
  insurance: IconShield,
  cashback: IconSpark,
  events: IconGift,
  advisor: IconUser,
};

export function PrivilegesGrid() {
  return (
    <div className="grid gap-px overflow-hidden rounded-[28px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
      {privileges.map((p, i) => {
        const Icon = icons[p.key];
        return (
          <Reveal key={p.key} delay={(i % 3) * 90} className="group relative bg-white p-8 md:p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/30 bg-gradient-to-br from-gold-light/60 to-white text-gold-deep transition-shadow duration-500 group-hover:shadow-[0_10px_30px_-12px_rgba(140,107,18,0.5)]">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="mt-7 font-display text-xl font-semibold tracking-tight">{p.title}</h3>
            <p className="mt-3 leading-relaxed text-muted">{p.text}</p>
          </Reveal>
        );
      })}
    </div>
  );
}

const strip = [
  "Conciergerie 24h/24",
  "1 300+ salons d'aéroport",
  "Cashback jusqu'à 2 %",
  "150 devises",
  "Assurances premium",
  "Événements privés",
  "Conseiller dédié",
  "Carte en métal",
];

export function PrivilegeMarquee() {
  const items = [...strip, ...strip];
  return (
    <div className="marquee overflow-hidden border-y border-line bg-mist py-5" aria-hidden="true">
      <div className="marquee-track">
        {items.map((s, i) => (
          <span key={i} className="flex items-center gap-10 pr-10 font-display text-lg font-medium tracking-tight text-ink/70">
            {s}
            <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
          </span>
        ))}
      </div>
    </div>
  );
}
