type PageSpinnerProps = {
  label?: string;
  className?: string;
};

/** Centered loading state for detail pages and panels. */
export function PageSpinner({ label = "Loading…", className = "" }: PageSpinnerProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white/90 px-6 py-20 shadow-soft sm:py-24 ${className}`}
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" aria-hidden />
      <p className="mt-4 text-sm text-slate-600">{label}</p>
    </div>
  );
}
