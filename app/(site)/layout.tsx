import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { RevealObserver } from "@/components/motion/RevealObserver";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
      >
        Aller au contenu
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <RevealObserver />
    </>
  );
}
