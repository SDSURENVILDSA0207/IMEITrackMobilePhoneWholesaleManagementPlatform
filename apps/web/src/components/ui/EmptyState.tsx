import type { ReactNode } from "react";

import { IconTint } from "@/components/ui/IconTint";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
};

const defaultIcon = (
  <IconTint tone="neutral" size="lg" className="mx-auto">
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
      />
    </svg>
  </IconTint>
);

export function EmptyState({ title, description, icon = defaultIcon, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-14 text-center sm:py-16">
      <div className="mb-4">{icon}</div>
      <p className="text-base font-semibold tracking-tight text-slate-900">{title}</p>
      {description ? <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">{description}</p> : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
