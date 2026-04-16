import type { PropsWithChildren } from "react";

type CardProps = PropsWithChildren<{
  className?: string;
  elevated?: boolean;
  interactive?: boolean;
}>;

export function Card({ className = "", elevated = false, interactive = false, children }: CardProps) {
  return (
    <section
      className={[
        "relative overflow-hidden rounded-2xl bg-surface/95 ring-1 ring-slate-200/70",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent",
        elevated ? "shadow-raised" : "shadow-soft",
        interactive ? "transition duration-200 hover:-translate-y-[1px] hover:shadow-raised" : "",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}
