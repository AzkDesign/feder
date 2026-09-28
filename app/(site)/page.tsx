import { FederCard } from "@/components/FederCard";
import { IconArrow, IconBellAlert, IconBolt, IconCard, IconChart, IconCheck, IconFingerprint, IconGlobe, IconLock, IconSnow, IconVault } from "@/components/Icons";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { CtaBand } from "@/components/sections/CtaBand";
import { Faq } from "@/components/sections/Faq";
import { PhoneMockup } from "@/components/sections/PhoneMockup";
import { PrivilegeMarquee, PrivilegesGrid } from "@/components/sections/Privileges";
import { Process } from "@/components/sections/Process";
import { Stats } from "@/components/sections/Stats";
import { Tiers } from "@/components/sections/Tiers";
import { Aurora, Eyebrow, Reveal, SectionHead } from "@/components/ui";
import { faq } from "@/lib/data";

export default function Home() {
  return (
    <>
      {/* ───────── Hero ───────── */}
      <section className="relative overflow-hidden pb-20 pt-36 md:pb-28 md:pt-44">
        <Aurora />
        <div className="wrap relative grid items-center gap-16 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <Reveal>
              <Eyebrow>Banque en ligne de prestige · Sur admission</Eyebrow>
            </Reveal>
            <Reveal delay={90}>
              <h1 className="mt-7 font-display text-[clamp(3rem,8vw,6.4rem)] font-semibold leading-[0.95] tracking-[-0.05em]">
                Une banque
                <br />
                qui <span className="text-gold-grad">se mérite.</span>
              </h1>
            </Reveal>
            <Reveal delay={180}>
              <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted md:text-xl">
                Feder réunit la puissance d'une néobanque et les privilèges d'une maison de prestige. Cartes en métal, conciergerie,
                salons d'aéroport. L'accès se fait sur dossier.
              </p>
            </Reveal>
            <Reveal delay={270} className="mt-10 flex flex-wrap items-center gap-3">
              <MagneticButton href="/admission" size="lg">
                Demander mon admission <IconArrow className="h-4 w-4" />
              </MagneticButton>
              <MagneticButton href="/cartes" variant="ghost" size="lg">
                Découvrir les cartes
              </MagneticButton>
            </Reveal>
            <Reveal delay={360} className="mt-10 flex flex-wrap gap-x-7 gap-y-2 text-sm text-muted">
              {["Réponse sous 48 h", "Sans engagement", "Carte virtuelle immédiate"].map((t) => (
                <span key={t} className="inline-flex items-center gap-2">
                  <IconCheck className="h-4 w-4 text-gold-deep" /> {t}
                </span>
              ))}
            </Reveal>
          </div>

          <Reveal delay={200} className="relative mx-auto w-full max-w-[520px]">
            <div className="absolute inset-x-8 -bottom-6 h-16 rounded-[50%] bg-ink/20 blur-2xl" aria-hidden="true" />
            <FederCard variant="gold" interactive float holder="A. DE VALMONT" />
          </Reveal>
        </div>
      </section>

      <Stats />

      {/* ───────── Tiers ───────── */}
      <section className="py-24 md:py-32">
        <div className="wrap">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <SectionHead eyebrow="Les cartes" title={<>Trois cartes. <br className="hidden md:block" />Un seul standard.</>} />
            <Reveal delay={200}>
              <MagneticButton href="/cartes" variant="ghost">
                Comparer en détail <IconArrow className="h-4 w-4" />
              </MagneticButton>
            </Reveal>
          </div>
          <div className="mt-14">
            <Tiers />
          </div>
        </div>
      </section>

      {/* ───────── Metal showcase (dark) ───────── */}
      <section className="relative overflow-hidden bg-ink py-24 text-white md:py-32">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(212,175,55,0.18), rgba(212,175,55,0) 60%)" }}
          aria-hidden="true"
        />
        <div className="wrap relative grid items-center gap-16 lg:grid-cols-2">
          <Reveal className="order-2 mx-auto w-full max-w-[480px] lg:order-1">
            <FederCard variant="noire" interactive holder="MEMBRE FEDER" last4="0001" />
          </Reveal>
          <div className="order-1 lg:order-2">
            <SectionHead
              light
              eyebrow="L'objet"
              title={<>Forgée dans le métal. <span className="text-gold-grad">Pas dans le plastique.</span></>}
              intro="Chaque carte Feder est découpée dans le métal, gravée au laser et livrée en main propre. Un objet que l'on remarque, et que l'on garde."
            />
            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
              {[
                "Métal de 18 grammes",
                "Numéros invisibles au recto",
                "Gravure laser à votre nom",
                "Paiement sans contact et mobile",
              ].map((t, i) => (
                <Reveal as="li" key={t} delay={200 + i * 70} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-white/80">
                  <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
                  {t}
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <PrivilegeMarquee />

      {/* ───────── Privileges ───────── */}
      <section className="py-24 md:py-32">
        <div className="wrap">
          <SectionHead
            eyebrow="Privilèges"
            title="Ce que l'on n'achète pas, on le reçoit."
            intro="Les avantages Feder ne sont pas des options. Ils font partie de votre adhésion, dès le premier jour."
          />
          <div className="mt-14">
            <PrivilegesGrid />
          </div>
        </div>
      </section>

      {/* ───────── App ───────── */}
      <section className="relative overflow-hidden bg-mist py-24 md:py-32">
        <div className="wrap grid items-center gap-16 lg:grid-cols-[1fr_1.1fr]">
          <Reveal>
            <PhoneMockup />
          </Reveal>
          <div>
            <SectionHead
              eyebrow="L'application"
              title="Toute votre banque, dans la paume de la main."
              intro="Une application pensée pour ne jamais vous faire attendre. Chaque geste est instantané, chaque information est claire."
            />
            <div className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-2">
              {[
                { Icon: IconBolt, t: "Virements instantanés", d: "En France et en Europe, en quelques secondes." },
                { Icon: IconGlobe, t: "150 devises", d: "Payez et retirez au taux de change réel." },
                { Icon: IconVault, t: "Coffres d'épargne", d: "Mettez de côté automatiquement, projet par projet." },
                { Icon: IconChart, t: "Analyse des dépenses", d: "Vos catégories, vos tendances, en un coup d'œil." },
              ].map(({ Icon, t, d }, i) => (
                <Reveal key={t} delay={150 + i * 80} className="flex gap-4">
                  <Icon className="h-6 w-6 shrink-0 text-gold-deep" />
                  <div>
                    <div className="font-medium">{t}</div>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={500} className="mt-10">
              <MagneticButton href="/application" variant="dark">
                Découvrir l'application <IconArrow className="h-4 w-4" />
              </MagneticButton>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────── Process ───────── */}
      <section className="py-24 md:py-32">
        <div className="wrap">
          <SectionHead
            eyebrow="Admission"
            title="Quatre étapes vers votre carte."
            intro="L'accès à Feder se fait sur dossier. Un parcours simple, étudié avec soin par nos équipes."
          />
          <div className="mt-14">
            <Process />
          </div>
        </div>
      </section>

      {/* ───────── Security ───────── */}
      <section className="border-y border-line bg-white py-20">
        <div className="wrap grid gap-10 lg:grid-cols-[1fr_2fr] lg:items-center">
          <SectionHead eyebrow="Sécurité" title="Votre tranquillité, par défaut." />
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { Icon: IconFingerprint, t: "Connexion biométrique", d: "Face ID, empreinte, ou code personnel." },
              { Icon: IconSnow, t: "Gel instantané", d: "Bloquez et débloquez votre carte en un geste." },
              { Icon: IconLock, t: "Paiements sécurisés", d: "Authentification forte sur chaque achat en ligne." },
              { Icon: IconBellAlert, t: "Alertes en temps réel", d: "Chaque opération notifiée à la seconde." },
            ].map(({ Icon, t, d }, i) => (
              <Reveal key={t} delay={i * 80} className="flex gap-4 rounded-2xl border border-line p-6">
                <Icon className="h-6 w-6 shrink-0 text-gold-deep" />
                <div>
                  <div className="font-medium">{t}</div>
                  <p className="mt-1 text-sm text-muted">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section className="py-24 md:py-32">
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <SectionHead eyebrow="Questions" title="Tout ce que vous voulez savoir." />
            <Reveal delay={200} className="mt-8 flex items-center gap-3 text-muted">
              <IconCard className="h-5 w-5 text-gold-deep" />
              Une autre question ? Votre conseiller vous répond.
            </Reveal>
          </div>
          <Reveal delay={100}>
            <Faq items={faq} />
          </Reveal>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
