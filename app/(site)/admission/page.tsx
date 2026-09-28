import type { Metadata } from "next";
import { AdmissionForm } from "@/components/AdmissionForm";
import { IconClock, IconLock, IconShield } from "@/components/Icons";
import { Aurora, Eyebrow, Reveal } from "@/components/ui";
import { getSettings } from "@/lib/server/db";

export const metadata: Metadata = {
  title: "Demande d'admission",
  description: "Déposez votre dossier d'admission Feder en quelques minutes. Réponse sous 48 heures ouvrées.",
};

export default async function AdmissionPage({ searchParams }: { searchParams: Promise<{ offre?: string }> }) {
  const { offre } = await searchParams;
  const settings = getSettings();
  const open = settings.admissions_open === "1";

  return (
    <section className="relative overflow-hidden pb-24 pt-36 md:pb-32 md:pt-44">
      <Aurora grid={false} />
      <div className="wrap relative grid gap-14 lg:grid-cols-[0.8fr_1.6fr]">
        <aside>
          <Reveal>
            <Eyebrow>Demande d'admission</Eyebrow>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 font-display text-[clamp(2.4rem,5vw,3.8rem)] font-semibold leading-[1] tracking-[-0.045em]">
              Rejoindre <span className="text-gold-grad">Feder.</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 text-lg leading-relaxed text-muted">
              Chaque dossier est étudié individuellement par nos équipes. Vous recevez une réponse sous 48 heures ouvrées.
            </p>
            <p className="mt-4 text-sm text-muted">
              Déjà déposé un dossier ?{" "}
              <a href="/suivi" className="font-medium text-ink underline decoration-gold underline-offset-4">
                Suivre ma demande
              </a>
            </p>
          </Reveal>
          <Reveal delay={240} className="mt-10 space-y-5 text-sm">
            {[
              { Icon: IconClock, t: "5 minutes pour déposer votre dossier" },
              { Icon: IconLock, t: "Transmission chiffrée de vos documents" },
              { Icon: IconShield, t: "Aucun engagement avant validation" },
            ].map(({ Icon, t }) => (
              <div key={t} className="flex items-center gap-3 text-ink/80">
                <Icon className="h-5 w-5 text-gold-deep" /> {t}
              </div>
            ))}
          </Reveal>
        </aside>

        <Reveal delay={120} className="rounded-[32px] border border-line bg-white/85 p-6 shadow-[0_40px_80px_-40px_rgba(20,16,4,0.25)] backdrop-blur-xl md:p-10">
          {open ? (
            <AdmissionForm initialOffer={offre} />
          ) : (
            <div className="py-10 text-center">
              <IconClock className="mx-auto h-10 w-10 text-gold-deep" />
              <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight">Admissions suspendues</h2>
              <p className="mx-auto mt-4 max-w-md leading-relaxed text-muted">{settings.closed_message}</p>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
