import { NavLink } from "react-router-dom";

import { mainNav } from "@/app/navigation";

/** Horizontal scroll nav for small screens (sidebar hidden). */
export function MobileNav() {
  return (
    <nav className="flex gap-1.5 overflow-x-auto border-b border-slate-200/80 bg-white/90 px-2 py-2 backdrop-blur md:hidden">
      {mainNav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={!!item.end}
          className={({ isActive }) =>
            [
              "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium no-underline transition-colors duration-150",
              isActive
                ? "bg-brand-100 text-brand-700 ring-1 ring-brand-100"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            ].join(" ")
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
