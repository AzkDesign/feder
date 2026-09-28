"use client";

import { useId, useState } from "react";
import { fmtCents } from "@/lib/banking-labels";

/** 30-day balance area chart: one hue, crosshair + tooltip on hover, accessible table. */
export function BalanceChart({ data }: { data: { d: string; b: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const gid = useId().replace(/:/g, "");
  const W = 640;
  const H = 150;
  const pad = 6;
  const vals = data.map((x) => x.b);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const x = (i: number) => pad + (i * (W - pad * 2)) / (data.length - 1);
  const y = (v: number) => pad + (H - pad * 2) * (1 - (v - min) / span);
  const line = data.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.b).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${H} L${x(0)},${H} Z`;
  const fmtDay = (d: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(d));

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label="Évolution du solde sur 30 jours"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const i = Math.round(((e.clientX - r.left) / r.width) * (data.length - 1));
          setHover(Math.max(0, Math.min(data.length - 1, i)));
        }}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d4af37" stopOpacity="0.28" />
            <stop offset="1" stopColor="#d4af37" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gid})`} />
        <path d={line} fill="none" stroke="#e8cd7a" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={0} y2={H} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <circle cx={x(hover)} cy={y(data[hover].b)} r="5" fill="#e8cd7a" stroke="#09090a" strokeWidth="2" />
          </g>
        )}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute -top-2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-white px-2.5 py-1.5 text-xs text-ink shadow-lg"
          style={{ left: `${(x(hover) / W) * 100}%` }}
        >
          {fmtDay(data[hover].d)} · <strong className="tabular-nums">{fmtCents(data[hover].b)}</strong>
        </div>
      )}
      <table className="sr-only">
        <caption>Solde de fin de journée</caption>
        <tbody>
          {data.map((p) => (
            <tr key={p.d}>
              <th scope="row">{p.d}</th>
              <td>{fmtCents(p.b)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
