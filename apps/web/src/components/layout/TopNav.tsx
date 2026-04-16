import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";

type TopNavProps = {
  title?: string;
  onToggleSidebar?: () => void;
};

function IconLogout(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className} aria-hidden>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPanel(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className} aria-hidden>
      <path d="M4 5h16M4 12h16M4 19h10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TopNav({ title = "Dashboard", onToggleSidebar }: TopNavProps) {
  const { user, roleLabel, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-xl md:px-8">
      <div className="flex min-w-0 items-center gap-2">
        <Button type="button" variant="ghost" size="sm" className="hidden md:inline-flex" onClick={onToggleSidebar}>
          <IconPanel className="h-4 w-4" />
        </Button>
        <h1 className="min-w-0 truncate text-lg font-semibold tracking-tight text-slate-900 md:text-[1.1rem]">{title}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {user && (
          <div className="hidden flex-col items-end sm:flex sm:pr-1">
            <span className="max-w-[12rem] truncate text-sm font-medium text-slate-900">{user.full_name}</span>
            {roleLabel && (
              <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{roleLabel}</span>
            )}
          </div>
        )}
        {roleLabel && (
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-100 sm:hidden">
            {roleLabel}
          </span>
        )}
        <Button type="button" variant="secondary" size="sm" onClick={signOut}>
          <IconLogout className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
