export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${light ? "text-white" : "text-ink"}`}>
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
        <defs>
          <linearGradient id="fg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8C6B12" />
            <stop offset=".5" stopColor="#F5E6B8" />
            <stop offset="1" stopColor="#B8912A" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#fg)" />
        <path d="M11 23V9h10.5M11 15.5h8" stroke="#1a1405" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      </svg>
      <span className="font-display text-[1.15rem] font-semibold tracking-[0.28em]">FEDER</span>
    </span>
  );
}
