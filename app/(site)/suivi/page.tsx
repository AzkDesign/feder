import type { Metadata } from "next";
import { TrackingClient } from "@/components/TrackingClient";
import { Aurora, Eyebrow, Reveal } from "@/components/ui";

export const metadata: Metadata = {
  title: "Suivre ma demande",
  description: "Consultez l'avancement de votre demande d'admission Feder et échangez avec nos équipes.",
};

export default function SuiviPage() {
  return (
    <section className="relative overflow-hidden pb-24 pt-36 md:pb-32 md:pt-44">
      <Aurora grid={false} />
      <div className="wrap relative grid gap-14 lg:grid-cols-[0.8fr_1.4fr]">
        <div>
          <Reveal>
            <Eyebrow>Suivi de dossier</Eyebrow>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 font-display text-[clamp(2.4rem,5vw,3.8rem)] font-semibold leading-[1] tracking-[-0.045em]">
              Où en est <span className="text-gold-grad">ma demande ?</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 text-lg leading-relaxed text-muted">
              Suivez l'examen de votre dossier en temps réel, lisez les messages de nos équipes et transmettez vos documents complémentaires,
              directement ici.
            </p>
          </Reveal>
        </div>
        <Reveal delay={120} className="rounded-[32px] border border-line bg-white/85 p-6 shadow-[0_40px_80px_-40px_rgba(20,16,4,0.25)] backdrop-blur-xl md:p-10">
          <TrackingClient />
        </Reveal>
      </div>
    </section>
  );
}
