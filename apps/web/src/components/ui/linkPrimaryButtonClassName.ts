const transitionBase = "transition-all duration-200 ease-out";

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
