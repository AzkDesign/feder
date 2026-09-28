import { Reveal } from "@/components/ui";
import { admissionSteps } from "@/lib/data";

export function Process() {
  return (
    <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {admissionSteps.map((s, i) => (
        <Reveal as="li" key={s.title} delay={i * 110} className="relative rounded-[24px] border border-line bg-white p-7">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-gold-deep">0{i + 1}</span>
            {i < admissionSteps.length - 1 && <span className="hidden h-px flex-1 translate-x-4 bg-gradient-to-r from-gold/60 to-transparent lg:block" />}
          </div>
          <h3 className="mt-8 font-display text-xl font-semibold tracking-tight">{s.title}</h3>
          <p className="mt-3 leading-relaxed text-muted">{s.text}</p>
        </Reveal>
      ))}
    </ol>
  );
}
