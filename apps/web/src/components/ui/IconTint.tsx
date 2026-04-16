import type { PropsWithChildren } from "react";

export type IconTintTone = "neutral" | "muted" | "brand" | "info" | "success" | "warning" | "danger";

const toneClasses: Record<IconTintTone, string> = {
  neutral:
    "bg-slate-100/75 text-slate-600 ring-1 ring-slate-200/60 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55)]",
  muted:
    "bg-slate-50/92 text-slate-500 ring-1 ring-slate-200/55 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)]",
  brand:
    "bg-brand-50/88 text-brand-700 ring-1 ring-brand-100/72 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55)]",
  info: "bg-sky-50/85 text-sky-700 ring-1 ring-sky-100/72 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55)]",
  success:
    "bg-success-50/88 text-success-700 ring-1 ring-success-600/12 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55)]",
  warning:
    "bg-warning-50/88 text-warning-700 ring-1 ring-warning-600/16 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55)]",
  danger:
    "bg-danger-50/88 text-danger-700 ring-1 ring-danger-600/14 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55)]",
};

const sizeClasses = {
  xs: "h-7 w-7 min-h-[1.75rem] min-w-[1.75rem] rounded-lg [&>svg]:h-3.5 [&>svg]:w-3.5",
  sm: "h-8 w-8 min-h-[2rem] min-w-[2rem] rounded-lg [&>svg]:h-4 [&>svg]:w-4",
  md: "h-10 w-10 min-h-[2.5rem] min-w-[2.5rem] rounded-xl [&>svg]:h-5 [&>svg]:w-5",
  lg: "h-14 w-14 min-h-[3.5rem] min-w-[3.5rem] rounded-2xl [&>svg]:h-8 [&>svg]:w-8",
};

type IconTintProps = PropsWithChildren<{
  tone?: IconTintTone;
  size?: keyof typeof sizeClasses;
  className?: string;
}>;

/** Wraps an icon in a small rounded well with a subtle semantic tint. */
export function IconTint({ tone = "neutral", size = "sm", className = "", children }: IconTintProps) {
  return (
    <span
      className={[
        "inline-flex shrink-0 items-center justify-center [&>svg]:shrink-0",
        sizeClasses[size],
        toneClasses[tone],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
