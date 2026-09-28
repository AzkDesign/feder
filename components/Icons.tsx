import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base = (props: P) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...props,
});

export const IconBell = (p: P) => (
  <svg {...base(p)}><path d="M4 18h16M6 18v-3a6 6 0 0 1 12 0v3M12 9V7M10 21h4" /></svg>
);
export const IconPlane = (p: P) => (
  <svg {...base(p)}><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" /></svg>
);
export const IconShield = (p: P) => (
  <svg {...base(p)}><path d="M12 3 4.5 6v6c0 4.5 3.2 7.8 7.5 9 4.3-1.2 7.5-4.5 7.5-9V6z" /><path d="m9 12 2 2 4-4" /></svg>
);
export const IconGlobe = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" /></svg>
);
export const IconSpark = (p: P) => (
  <svg {...base(p)}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></svg>
);
export const IconUser = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
);
export const IconGift = (p: P) => (
  <svg {...base(p)}><rect x="3.5" y="8" width="17" height="4" rx="1" /><path d="M5 12v8.5h14V12M12 8v12.5M12 8S10.5 3.5 8 4.5 9.5 8 12 8zM12 8s1.5-4.5 4-3.5S14.5 8 12 8z" /></svg>
);
export const IconLock = (p: P) => (
  <svg {...base(p)}><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2" /></svg>
);
export const IconFingerprint = (p: P) => (
  <svg {...base(p)}><path d="M6.5 7.5A7 7 0 0 1 19 12v1M5 12a7 7 0 0 1 .3-2M8.5 20.5c1-1.7 1.5-4 1.5-7a2 2 0 0 1 4 0c0 3-.5 5.5-1.5 7.5M17.5 18.5c.3-1.2.5-2.9.5-5.5a6 6 0 0 0-9-5.2M6 16c.7-1 1-2.6 1-4" /></svg>
);
export const IconSnow = (p: P) => (
  <svg {...base(p)}><path d="M12 2v20M4 7l16 10M20 7 4 17M9 4l3 2 3-2M9 20l3-2 3 2" /></svg>
);
export const IconBolt = (p: P) => (
  <svg {...base(p)}><path d="M13 2 4.5 13.5H12L11 22l8.5-11.5H12z" /></svg>
);
export const IconVault = (p: P) => (
  <svg {...base(p)}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="12" cy="12" r="3.5" /><path d="M12 8.5V7M12 17v-1.5M15.5 12H17M7 12h1.5M6 20v1.5M18 20v1.5" /></svg>
);
export const IconCard = (p: P) => (
  <svg {...base(p)}><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 10h19M6 15h4" /></svg>
);
export const IconChart = (p: P) => (
  <svg {...base(p)}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
);
export const IconBellAlert = (p: P) => (
  <svg {...base(p)}><path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15zM10 21h4" /></svg>
);
export const IconArrow = (p: P) => (
  <svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const IconCheck = (p: P) => (
  <svg {...base(p)}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);
export const IconPlus = (p: P) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconDoc = (p: P) => (
  <svg {...base(p)}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></svg>
);
export const IconClock = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
