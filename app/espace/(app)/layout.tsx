import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: { default: "Le Salon", template: "%s · Le Salon Feder" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#09090a" };

export default function EspaceRoot({ children }: { children: React.ReactNode }) {
  return (
    <div className="salon relative min-h-dvh">
      <div className="salon-glow" aria-hidden="true" />
      <div className="relative">{children}</div>
    </div>
  );
}
