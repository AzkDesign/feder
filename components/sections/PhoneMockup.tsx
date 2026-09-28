import { FederCard } from "@/components/FederCard";
import { CountUp } from "@/components/motion/CountUp";

const tx = [
  { label: "Vol Paris → New York", sub: "Voyage · Hier", amount: "− 3 240,00 €" },
  { label: "Hôtel · Paris 8e", sub: "Hébergement · Lun.", amount: "− 890,00 €" },
  { label: "Cashback du mois", sub: "Feder · 1er", amount: "+ 186,40 €", positive: true },
  { label: "Virement reçu", sub: "Salaire · 28 sept.", amount: "+ 12 500,00 €", positive: true },
];

/** Pure-CSS phone showing the Feder app. */
export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[290px] md:w-[320px]">
      <div className="rounded-[46px] bg-ink p-2.5 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.55)] ring-1 ring-black/10">
        <div className="relative overflow-hidden rounded-[38px] bg-[#0f0f11] px-5 pb-6 pt-12 text-white">
          <div className="absolute left-1/2 top-3 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />

          <div className="flex items-center justify-between text-xs text-white/50">
            <span>Bonjour,</span>
            <span className="font-mono tracking-[0.18em] text-gold-light/80">PLATINE</span>
          </div>
          <div className="mt-1 text-sm text-white/80">Compte principal</div>

          <div className="mt-5 text-[11px] uppercase tracking-[0.2em] text-white/40">Solde disponible</div>
          <div className="mt-1 font-display text-[2rem] font-semibold tracking-tight">
            <CountUp value={48750.2} decimals={2} suffix=" €" duration={2200} />
          </div>

          <div className="mt-5">
            <FederCard variant="platine" className="w-full" />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[11px]">
            {["Envoyer", "Recevoir", "Coffres"].map((a) => (
              <div key={a} className="rounded-2xl bg-white/[0.06] py-3 text-white/75">
                {a}
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-3.5">
            {tx.map((t) => (
              <div key={t.label} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-[13px]">{t.label}</div>
                  <div className="text-[11px] text-white/40">{t.sub}</div>
                </div>
                <div className={`shrink-0 font-mono text-[12px] tabular-nums ${t.positive ? "text-gold-light" : "text-white/80"}`}>{t.amount}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
