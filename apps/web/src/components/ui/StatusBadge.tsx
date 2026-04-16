import type { PropsWithChildren } from "react";

type StatusTone = "neutral" | "info" | "success" | "warning" | "danger" | "purple";

type StatusBadgeProps = PropsWithChildren<{
  tone?: StatusTone;
  className?: string;
}>;

const toneClasses: Record<StatusTone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  info: "bg-brand-50 text-brand-700 ring-brand-100",
  success: "bg-success-50 text-success-700 ring-success-600/20",
  warning: "bg-warning-50 text-warning-700 ring-warning-600/20",
  danger: "bg-danger-50 text-danger-700 ring-danger-600/20",
  purple: "bg-violet-50 text-violet-700 ring-violet-200",
};

export function StatusBadge({ tone = "neutral", className = "", children }: StatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        "uppercase tracking-wide ring-1 ring-inset",
        toneClasses[tone],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
