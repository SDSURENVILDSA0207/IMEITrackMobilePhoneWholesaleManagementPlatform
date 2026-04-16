import type { PropsWithChildren } from "react";

type StatusTone = "neutral" | "info" | "success" | "warning" | "danger" | "purple";

type StatusBadgeProps = PropsWithChildren<{
  tone?: StatusTone;
  className?: string;
}>;

const toneClasses: Record<StatusTone, string> = {
  neutral: "bg-slate-100/80 text-slate-700 ring-slate-200/80",
  info: "bg-brand-50/90 text-brand-700 ring-brand-100/90",
  success: "bg-success-50/90 text-success-700 ring-success-600/20",
  warning: "bg-warning-50/90 text-warning-700 ring-warning-600/25",
  danger: "bg-danger-50/90 text-danger-700 ring-danger-600/25",
  purple: "bg-violet-50/90 text-violet-700 ring-violet-200/90",
};

export function StatusBadge({ tone = "neutral", className = "", children }: StatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
        "uppercase tracking-[0.08em] ring-1 ring-inset",
        toneClasses[tone],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
