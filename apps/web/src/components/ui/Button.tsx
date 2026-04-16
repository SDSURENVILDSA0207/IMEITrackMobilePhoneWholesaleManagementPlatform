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

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-brand-600 bg-brand-600 text-white shadow-sm hover:border-brand-500 hover:bg-brand-500",
  secondary:
    "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50",
  danger: "border border-danger-600 bg-danger-600 text-white shadow-sm hover:border-danger-700 hover:bg-danger-700",
  ghost: "border border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2.5 text-sm",
};

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
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold tracking-tight transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/35 focus-visible:ring-offset-1",
        "active:translate-y-[0.5px]",
        "disabled:cursor-not-allowed disabled:opacity-60",
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
