import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Feder · La banque en ligne de prestige",
    template: "%s · Feder",
  },
  description:
    "Feder réunit la puissance d'une banque en ligne et les privilèges d'une maison de prestige. Cartes en métal, conciergerie, salons d'aéroport. Accès sur admission.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${sora.variable} ${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Flag JS early so scroll-reveal elements start hidden without a flash */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
