import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
};

const defaultIcon = (
  <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
    />
  </svg>
);

export function EmptyState({ title, description, icon = defaultIcon, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-14 text-center sm:py-16">
      <div className="mb-4 rounded-2xl bg-brand-50/70 p-4 ring-1 ring-brand-100/80">{icon}</div>
      <p className="text-base font-semibold tracking-tight text-slate-900">{title}</p>
      {description ? <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">{description}</p> : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
