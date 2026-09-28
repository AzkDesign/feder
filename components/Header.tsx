"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { MagneticButton } from "./motion/MagneticButton";

const nav = [
  { href: "/cartes", label: "Cartes" },
  { href: "/privileges", label: "Privilèges" },
  { href: "/application", label: "Application" },
  { href: "/securite", label: "Sécurité" },
  { href: "/maison", label: "La Maison" },
];

export function Header() {
  const pathname = usePathname();
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      setCompact(window.scrollY > 24);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      <header className="site-header fixed inset-x-0 top-0 z-50 h-[84px]" data-compact={compact || open}>
        <div className="hdr-bg absolute inset-0 border-b border-line/80 bg-white/80 backdrop-blur-xl" />
        <div className="hdr-inner wrap relative flex h-full items-center justify-between">
          <Link href="/" className="hdr-logo" aria-label="Feder, accueil">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-[0.92rem] transition-colors duration-300 ${
                    active ? "bg-ink/[0.05] text-ink" : "text-muted hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link href="/espace" className="px-3 py-2 text-[0.92rem] text-muted transition-colors hover:text-ink">
              Espace client
            </Link>
            <MagneticButton href="/admission" size="sm" strength={0.25}>
              Demander l'admission
            </MagneticButton>
          </div>

          <button
            type="button"
            className="relative -mr-2 flex h-11 w-11 items-center justify-center lg:hidden"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className={`absolute h-px w-5 bg-ink transition-transform duration-500 ease-out-strong ${open ? "rotate-45" : "-translate-y-[4px]"}`} />
            <span className={`absolute h-px w-5 bg-ink transition-transform duration-500 ease-out-strong ${open ? "-rotate-45" : "translate-y-[4px]"}`} />
          </button>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 bg-white transition-opacity duration-500 ease-out-strong lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
      >
        <nav className="wrap flex h-full flex-col justify-center gap-2 pb-10 pt-24" aria-label="Navigation mobile">
          {[...nav, { href: "/espace", label: "Espace client" }].map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              tabIndex={open ? 0 : -1}
              className="border-b border-line py-4 font-display text-3xl font-semibold tracking-tight transition-[opacity,transform] duration-500 ease-out-strong"
              style={{
                transitionDelay: open ? `${60 + i * 40}ms` : "0ms",
                opacity: open ? 1 : 0,
                transform: open ? "none" : "translate3d(0, 16px, 0)",
              }}
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-8">
            <MagneticButton href="/admission" size="lg" className="w-full">
              Demander l'admission
            </MagneticButton>
          </div>
        </nav>
      </div>
    </>
  );
}
