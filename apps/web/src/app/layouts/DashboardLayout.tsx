import { useEffect, useState } from "react";
import { LayoutDashboard } from "lucide-react";
import { Outlet, useLocation } from "react-router-dom";

import { getDashboardTitle, getNavMatchForPath } from "@/app/navigation";
import { OpsCopilot } from "@/components/assistant/OpsCopilot";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";

export function DashboardLayout() {
  const { pathname } = useLocation();
  const title = getDashboardTitle(pathname);
  const navMatch = getNavMatchForPath(pathname);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("dashboard.sidebar.collapsed");
    if (saved) setSidebarCollapsed(saved === "1");
  }, []);

  useEffect(() => {
    window.localStorage.setItem("dashboard.sidebar.collapsed", sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed]);

  return (
    <div className="app-bg flex min-h-screen text-slate-900">
      <div className="hidden md:flex">
        <Sidebar collapsed={sidebarCollapsed} onToggleCollapsed={() => setSidebarCollapsed((v) => !v)} />
      </div>
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <TopNav title={title} titleIcon={navMatch?.icon ?? LayoutDashboard} />
        <MobileNav />
        <main className="flex-1 overflow-x-hidden px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-[1400px]">
            <Outlet />
          </div>
        </main>
        <OpsCopilot />
      </div>
    </div>
  );
}
