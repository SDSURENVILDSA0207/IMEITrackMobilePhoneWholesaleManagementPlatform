import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
  }
>;

const transitionBase = "transition-all duration-200 ease-out";

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    "border border-brand-600/90 bg-brand-600 text-white shadow-soft",
    transitionBase,
    "hover:-translate-y-px hover:border-brand-500 hover:bg-brand-500 hover:shadow-raised",
    "active:translate-y-0 active:border-brand-600/95 active:bg-brand-600 active:shadow-soft",
  ].join(" "),
  secondary: [
    "border border-slate-200/90 bg-white/95 text-slate-800 shadow-soft",
    transitionBase,
    "hover:-translate-y-px hover:border-slate-300 hover:bg-slate-50/95 hover:shadow-raised",
    "active:translate-y-0 active:border-slate-200/95 active:bg-white active:shadow-soft",
  ].join(" "),
  danger: [
    "border border-danger-600/90 bg-danger-600 text-white shadow-soft",
    transitionBase,
    "hover:-translate-y-px hover:border-danger-700 hover:bg-danger-700 hover:shadow-raised",
    "active:translate-y-0 active:shadow-soft",
  ].join(" "),
  ghost: [
    "border border-transparent bg-transparent text-slate-600 shadow-none",
    transitionBase,
    "hover:-translate-y-px hover:bg-slate-100/90 hover:text-slate-900 hover:shadow-sm",
    "active:translate-y-0 active:bg-slate-100",
  ].join(" "),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-[2.25rem] px-3.5 py-2 text-sm",
  md: "min-h-[2.5rem] px-4 py-2.5 text-sm",
};

/** Use on `<Link>` / `<a>` when a real anchor is required (same look as `Button variant="primary"`). */
export const linkPrimaryButtonClassName = [
  "inline-flex items-center justify-center gap-2 font-semibold tracking-tight text-white no-underline",
  "min-h-[2.5rem] px-4 py-2.5 text-sm",
  "rounded-2xl border border-brand-600/90 bg-brand-600 shadow-soft",
  transitionBase,
  "hover:-translate-y-px hover:border-brand-500 hover:bg-brand-500 hover:shadow-raised",
  "active:translate-y-0 active:border-brand-600/95 active:bg-brand-600 active:shadow-soft",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30 focus-visible:ring-offset-1",
].join(" ");

export function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  fullWidth = false,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={[
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl font-semibold tracking-tight",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30 focus-visible:ring-offset-1",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
