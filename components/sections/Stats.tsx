import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/ui";

const stats = [
  { value: 2, suffix: " %", label: "de cashback sur chaque dépense" },
  { value: 1300, suffix: "+", label: "salons d'aéroport dans le monde" },
  { value: 150, suffix: "", label: "devises au taux de change réel" },
  { value: 24, suffix: "h/24", label: "conciergerie, 7 jours sur 7" },
];

export function Stats() {
  return (
    <section className="border-y border-line bg-white">
      <div className="wrap grid grid-cols-2 md:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal
            key={s.label}
            delay={i * 90}
            className={`border-line py-10 md:py-14 ${i % 2 === 1 ? "border-l pl-6" : "pr-6"} ${i === 2 ? "md:border-l" : ""} ${
              i > 0 ? "md:pl-10" : ""
            } ${i >= 2 ? "border-t md:border-t-0" : ""}`}
          >
            <div className="font-display text-[clamp(2.2rem,4.5vw,3.6rem)] font-semibold leading-none tracking-[-0.04em]">
              <CountUp value={s.value} suffix={s.suffix} className="text-gold-grad" />
            </div>
            <p className="mt-3 max-w-[14rem] text-sm leading-snug text-muted">{s.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
