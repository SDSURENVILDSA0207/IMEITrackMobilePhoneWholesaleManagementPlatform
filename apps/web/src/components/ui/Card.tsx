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
        "relative overflow-hidden rounded-2xl border border-slate-200/80 bg-surface",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-slate-300/60 before:to-transparent",
        elevated ? "shadow-raised" : "shadow-soft",
        interactive ? "transition duration-150 hover:-translate-y-[1px] hover:shadow-raised" : "",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}
