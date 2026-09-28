import { FederCard } from "@/components/FederCard";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { Aurora } from "@/components/ui";

export default function NotFound() {
  return (
    <>
    <Header />
    <section className="relative overflow-hidden pb-24 pt-40 md:pt-48">
      <Aurora />
      <div className="wrap relative grid items-center gap-14 lg:grid-cols-2">
        <div>
          <div className="font-mono text-sm tracking-[0.2em] text-gold-deep">ERREUR 404</div>
          <h1 className="mt-5 font-display text-[clamp(2.6rem,6vw,4.8rem)] font-semibold leading-[1] tracking-[-0.045em]">
            Cette page n'est pas <span className="text-gold-grad">sur la liste.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted">La page que vous cherchez n'existe pas ou a été déplacée.</p>
          <div className="mt-10">
            <MagneticButton href="/" size="lg">Retour à l'accueil</MagneticButton>
          </div>
        </div>
        <FederCard variant="noire" interactive float className="mx-auto w-full max-w-[420px]" />
      </div>
    </section>
    <Footer />
    </>
  );
}
