import type { ReactNode } from "react";

import { IconTint, type IconTintTone } from "@/components/ui/IconTint";

type Accent = "indigo" | "slate" | "emerald" | "rose" | "amber";

const accentTone: Record<Accent, IconTintTone> = {
  indigo: "brand",
  slate: "neutral",
  emerald: "success",
  rose: "danger",
  amber: "warning",
};

const accentStyles: Record<Accent, { ring: string; tint: string; glow: string; valueTone: string; icon: ReactNode }> = {
  indigo: {
    ring: "ring-brand-100/80",
    tint: "bg-[linear-gradient(180deg,rgba(236,246,250,0.78),rgba(255,255,255,0.97))]",
    glow: "bg-brand-100/65",
    valueTone: "text-brand-700",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-9.75 3.75h7.5m-7.75 3h9.75m-9.75 3h9.75" />
      </svg>
    ),
  },
  slate: {
    ring: "ring-slate-200/90",
    tint: "bg-[linear-gradient(180deg,rgba(248,250,252,0.88),rgba(255,255,255,0.97))]",
    glow: "bg-slate-100/75",
    valueTone: "text-slate-900",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  emerald: {
    ring: "ring-success-600/20",
    tint: "bg-[linear-gradient(180deg,rgba(238,252,245,0.82),rgba(255,255,255,0.97))]",
    glow: "bg-success-50/80",
    valueTone: "text-success-700",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
      </svg>
    ),
  },
  rose: {
    ring: "ring-danger-600/20",
    tint: "bg-[linear-gradient(180deg,rgba(255,242,242,0.78),rgba(255,255,255,0.97))]",
    glow: "bg-danger-50/80",
    valueTone: "text-danger-700",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
  },
  amber: {
    ring: "ring-warning-600/20",
    tint: "bg-[linear-gradient(180deg,rgba(255,249,236,0.82),rgba(255,255,255,0.97))]",
    glow: "bg-warning-50/80",
    valueTone: "text-warning-700",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
};

export type DashboardStatCardProps = {
  label: string;
  value: number | string;
  accent?: Accent;
  loading?: boolean;
};

export function DashboardStatCard({ label, value, accent = "slate", loading }: DashboardStatCardProps) {
  const a = accentStyles[accent];
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-slate-200/60 px-8 py-6 shadow-soft ring-1 transition duration-200 hover:-translate-y-[1px] hover:shadow-raised ${a.ring} ${a.tint}`}
    >
      <div className={`pointer-events-none absolute -right-4 -top-8 h-20 w-20 rounded-full blur-2xl transition group-hover:scale-110 ${a.glow}`} />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">{label}</p>
          {loading ? (
            <div className="mt-3 h-11 w-28 animate-pulse rounded-lg bg-slate-100/90" aria-hidden />
          ) : (
            <p
              className={`mt-2.5 text-[2.125rem] font-bold leading-none tabular-nums tracking-[-0.02em] sm:text-[2.25rem] ${a.valueTone}`}
            >
              {value}
            </p>
          )}
        </div>
        <IconTint tone={accentTone[accent]} size="md">
          {a.icon}
        </IconTint>
      </div>
    </div>
  );
}
