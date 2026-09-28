import type { CSSProperties, ElementType, ReactNode } from "react";

/** Scroll-reveal wrapper. Picked up by <RevealObserver/>. */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  as?: ElementType;
  className?: string;
}) {
  return (
    <Tag data-reveal className={className} style={{ "--d": `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  );
}

export function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <div className={`inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.24em] ${light ? "text-gold-light" : "text-gold-deep"}`}>
      <span className={`h-px w-8 ${light ? "bg-gold/60" : "bg-gold"}`} />
      {children}
    </div>
  );
}

export function SectionHead({
  eyebrow,
  title,
  intro,
  light = false,
  center = false,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  light?: boolean;
  center?: boolean;
}) {
  return (
    <div className={`max-w-3xl ${center ? "mx-auto text-center" : ""}`}>
      <Reveal>
        <Eyebrow light={light}>{eyebrow}</Eyebrow>
      </Reveal>
      <Reveal delay={80}>
        <h2 className={`mt-5 font-display text-[clamp(2rem,4.6vw,3.5rem)] font-semibold leading-[1.04] tracking-[-0.035em] ${light ? "text-white" : "text-ink"}`}>
          {title}
        </h2>
      </Reveal>
      {intro && (
        <Reveal delay={160}>
          <p className={`mt-5 text-lg leading-relaxed ${light ? "text-white/60" : "text-muted"} ${center ? "mx-auto" : ""} max-w-2xl`}>{intro}</p>
        </Reveal>
      )}
    </div>
  );
}

export function Aurora({ grid = true }: { grid?: boolean }) {
  return (
    <div className="aurora" aria-hidden="true">
      <div className="blob b1" />
      <div className="blob b2" />
      <div className="blob b3" />
      <div className="blob b4" />
      {grid && <div className="grid-lines" />}
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden pb-20 pt-40 md:pb-28 md:pt-48">
      <Aurora />
      <div className="wrap relative">
        <Reveal>
          <Eyebrow>{eyebrow}</Eyebrow>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="mt-6 max-w-4xl font-display text-[clamp(2.6rem,7vw,5.5rem)] font-semibold leading-[0.98] tracking-[-0.045em]">{title}</h1>
        </Reveal>
        {intro && (
          <Reveal delay={160}>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted md:text-xl">{intro}</p>
          </Reveal>
        )}
        {children && <Reveal delay={240} className="mt-10">{children}</Reveal>}
      </div>
    </section>
  );
}

/** Placeholder the owner must fill in (regulatory data, etc.). */
export function ToFill({ children }: { children: ReactNode }) {
  return <mark className="rounded bg-gold-light/60 px-1.5 py-0.5 text-ink">[À compléter : {children}]</mark>;
}
