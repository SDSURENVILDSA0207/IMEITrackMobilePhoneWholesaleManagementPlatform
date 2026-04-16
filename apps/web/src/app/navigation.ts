import type { LucideIcon } from "lucide-react";
import {
  Building2,
  LayoutDashboard,
  Package,
  ReceiptText,
  RotateCcw,
  ShoppingCart,
  Users,
} from "lucide-react";

/** Primary app sections — drives sidebar, mobile nav, active route, and top bar icon. */
export type MainNavItem = {
  readonly to: string;
  readonly label: string;
  readonly icon: LucideIcon;
  /** When true, `NavLink` only matches exactly (used for dashboard `/`). */
  readonly end?: true;
};

export const mainNav: readonly MainNavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/suppliers", label: "Suppliers", icon: Building2 },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/purchase-orders", label: "Purchase orders", icon: ShoppingCart },
  { to: "/sales-orders", label: "Sales orders", icon: ReceiptText },
  { to: "/returns", label: "Returns", icon: RotateCcw },
];

/**
 * Which main nav section the current path belongs to (longest-prefix wins; `/` is exact only).
 * Used for top bar icon and any “section” chrome.
 */
export function getNavMatchForPath(pathname: string): MainNavItem | null {
  const path = pathname && pathname !== "" ? pathname : "/";
  const sorted = [...mainNav].sort((a, b) => b.to.length - a.to.length);
  for (const item of sorted) {
    if (item.to === "/") {
      if (path === "/") return item;
      continue;
    }
    if (path === item.to || path.startsWith(`${item.to}/`)) return item;
  }
  return null;
}

export const routeTitles: Record<string, string> = {
  "/": "Dashboard",
  "/suppliers": "Suppliers",
  "/customers": "Customers",
  "/inventory": "Inventory",
  "/purchase-orders": "Purchase orders",
  "/sales-orders": "Sales orders",
  "/returns": "Returns / RMA",
  "/returns/new": "New return request",
};

export function getDashboardTitle(pathname: string): string {
  if (routeTitles[pathname]) return routeTitles[pathname];
  if (/^\/inventory\/batches\/\d+$/.test(pathname)) return "Inventory batch";
  if (pathname === "/purchase-orders/new") return "New purchase order";
  if (/^\/purchase-orders\/\d+$/.test(pathname)) return "Purchase order";
  if (pathname === "/sales-orders/new") return "New sales order";
  if (/^\/sales-orders\/\d+$/.test(pathname)) return "Sales order";
  if (/^\/returns\/\d+$/.test(pathname)) return "Return request";
  return "IMEITrack";
}
