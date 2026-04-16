export const mainNav = [
  { to: "/", label: "Dashboard", end: true as const },
  { to: "/suppliers", label: "Suppliers" },
  { to: "/customers", label: "Customers" },
  { to: "/inventory", label: "Inventory" },
  { to: "/purchase-orders", label: "Purchase orders" },
  { to: "/sales-orders", label: "Sales orders" },
  { to: "/returns", label: "Returns" },
] as const;

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
