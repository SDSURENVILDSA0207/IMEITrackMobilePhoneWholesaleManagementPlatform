import { NavLink } from "react-router-dom";

import { mainNav } from "@/app/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";

type SidebarProps = {
  collapsed?: boolean;
};

function DotIcon(props: { className?: string }) {
  return <span className={["h-1.5 w-1.5 rounded-full bg-current", props.className ?? ""].join(" ")} aria-hidden />;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const { user, roleLabel } = useAuth();

  return (
    <aside
      className={[
        "flex shrink-0 flex-col border-r border-slate-200/70 bg-white/80 backdrop-blur-xl transition-[width] duration-150",
        collapsed ? "w-[84px]" : "w-64",
      ].join(" ")}
    >
      <div className={["flex h-16 items-center border-b border-slate-100", collapsed ? "justify-center px-3" : "gap-2 px-5"].join(" ")}>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white shadow-sm ring-1 ring-brand-500/30">
          IM
        </div>
        <div className={collapsed ? "hidden" : ""}>
          <p className="text-sm font-semibold text-slate-900">IMEITrack</p>
          <p className="text-xs font-medium text-slate-500">Wholesale</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1.5 p-3">
        {mainNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={"end" in item ? item.end : false}
            className={({ isActive }) =>
              [
                "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:ring-1 hover:ring-slate-200/80",
              ].join(" ")
            }
            title={collapsed ? item.label : undefined}
          >
            <DotIcon className={collapsed ? "" : "mr-2"} />
            {!collapsed ? item.label : null}
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
