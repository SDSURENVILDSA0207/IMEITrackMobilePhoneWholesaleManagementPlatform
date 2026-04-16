import { NavLink } from "react-router-dom";

import { mainNav } from "@/app/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { IconTint } from "@/components/ui/IconTint";
import type { LucideIcon } from "lucide-react";

type SidebarProps = {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
};

function BrandMark({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={["pointer-events-none flex items-center select-none", collapsed ? "justify-center" : "gap-3"].join(" ")}>
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] shadow-soft ring-1 ring-slate-200/70">
        <div className="absolute inset-0 bg-[linear-gradient(155deg,rgba(59,74,190,0.97)_0%,rgba(42,103,134,0.95)_62%,rgba(30,78,102,0.94)_100%)]" />
        <div className="pointer-events-none absolute inset-x-1 top-1 h-3 rounded-full bg-white/20 blur-[1px]" />
        <span className="relative text-[14px] font-semibold tracking-[0.01em] text-white">IM</span>
      </div>
      {!collapsed ? (
        <div className="min-w-0 text-left">
          <p className="text-[1.06rem] leading-none font-semibold tracking-[-0.015em] text-slate-900">
            <span className="text-brand-700">IMEI</span>Track
          </p>
          <p className="mt-0.5 text-[12px] font-medium tracking-[0.01em] text-slate-500">Wholesale</p>
        </div>
      ) : null}
    </div>
  );
}

function SidebarBrand({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!collapsed}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className={[
        "group flex w-full cursor-pointer items-center rounded-xl border border-transparent text-left outline-none transition-all duration-200 ease-out",
        "hover:border-slate-200/60 hover:bg-slate-50/90 hover:shadow-sm",
        "active:scale-[0.99]",
        "focus-visible:ring-2 focus-visible:ring-brand-600/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        collapsed ? "justify-center px-1 py-1.5" : "gap-0 px-2 py-1.5",
      ].join(" ")}
    >
      <BrandMark collapsed={collapsed} />
    </button>
  );
}

function NavIcon({ Icon, isActive, collapsed }: { Icon: LucideIcon; isActive: boolean; collapsed: boolean }) {
  return (
    <IconTint tone={isActive ? "brand" : "muted"} size="sm" className={collapsed ? "" : "mr-2.5"}>
      <Icon aria-hidden strokeWidth={1.9} />
    </IconTint>
  );
}

export function Sidebar({ collapsed = false, onToggleCollapsed }: SidebarProps) {
  const { user, roleLabel } = useAuth();

  return (
    <aside
      className={[
        "flex shrink-0 flex-col border-r border-slate-200/70 bg-white/80 backdrop-blur-xl transition-[width] duration-200 ease-out",
        collapsed ? "w-[84px]" : "w-64",
      ].join(" ")}
    >
      <div
        className={["flex h-16 items-center border-b border-slate-100 transition-[padding] duration-200 ease-out", collapsed ? "px-2" : "px-3"].join(
          " ",
        )}
      >
        <SidebarBrand collapsed={collapsed} onToggle={() => onToggleCollapsed?.()} />
      </div>
      <nav className="flex-1 space-y-1.5 p-3">
        {mainNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={!!item.end}
            className={({ isActive }) =>
              [
                "group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium no-underline transition-all duration-200",
                isActive
                  ? "bg-brand-50/80 text-brand-700 ring-1 ring-brand-100/80"
                  : "text-slate-600 hover:bg-slate-50/85 hover:text-slate-900",
              ].join(" ")
            }
            title={collapsed ? item.label : undefined}
          >
            {({ isActive }) => (
              <>
                <NavIcon Icon={item.icon} isActive={isActive} collapsed={collapsed} />
                {!collapsed ? item.label : null}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className={["border-t border-slate-100 p-4", collapsed ? "px-3" : ""].join(" ")}>
        {user ? (
          <div className={["mb-3 rounded-xl bg-slate-50/90 ring-1 ring-slate-200/70", collapsed ? "px-2 py-2 text-center" : "px-3 py-2.5"].join(" ")}>
            <p className="truncate text-sm font-medium text-slate-900">{collapsed ? user.full_name.split(" ")[0] : user.full_name}</p>
            {!collapsed ? <p className="truncate text-xs text-slate-500">{user.email}</p> : null}
            {roleLabel && (
              <span className="mt-1.5 inline-block rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700 ring-1 ring-brand-100">
                {roleLabel}
              </span>
            )}
          </div>
        ) : null}
        {!collapsed ? <p className="text-xs font-medium text-slate-400">v0.1.0</p> : null}
      </div>
    </aside>
  );
}
