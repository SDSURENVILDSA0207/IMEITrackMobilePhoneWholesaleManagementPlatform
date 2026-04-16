import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  eyebrow?: string;
};

export function PageHeader({ title, description, action, eyebrow }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-700">{eyebrow}</p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.65rem]">{title}</h1>
        {description ? <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
