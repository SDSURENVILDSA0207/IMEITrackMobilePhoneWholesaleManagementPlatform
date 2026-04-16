import type { PropsWithChildren } from "react";

export function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900">
      <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-brand-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-slate-500/20 blur-3xl" />
      <div className="flex min-h-screen items-center justify-center p-6">{children}</div>
    </div>
  );
}
