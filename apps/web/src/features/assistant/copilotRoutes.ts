import { CopilotQueryValue } from "@/features/assistant/copilotPageContext";

/** Human-readable labels for in-app routes (assistant navigation + UI chips). */
export const COPILOT_ROUTE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/suppliers": "Suppliers",
  "/customers": "Customers",
  "/inventory": "Inventory",
  "/purchase-orders": "Purchase orders",
  "/sales-orders": "Sales orders",
  "/returns": "Returns / RMA",
};

export function copilotOpenedSummary(target: string): string {
  return copilotNavigationSummary(target, {});
}

/** Short confirmation line for in-chat navigation, including common query-driven views. */
export function copilotNavigationSummary(pathname: string, query: Record<string, string>): string {
  const label = COPILOT_ROUTE_LABELS[pathname] ?? (pathname.replace(/^\//, "") || "page");
  if (!query || Object.keys(query).length === 0) {
    return `Opened ${label}`;
  }
  if (pathname === "/inventory") {
    if (query.copilot === CopilotQueryValue.copilotLowStock) return `Opened ${label} · low-stock`;
    if (query.imei) return `Opened ${label} · IMEI search`;
  }
  if (pathname === "/sales-orders" && query.sort === CopilotQueryValue.sortRecent) {
    return `Opened ${label} · recent first`;
  }
  if (pathname === "/purchase-orders" && query.sort === CopilotQueryValue.sortRecent) {
    return `Opened ${label} · recent first`;
  }
  if (pathname === "/returns" && query.status) {
    return `Opened ${label} · ${query.status === "requested" ? "pending queue" : query.status}`;
  }
  if (pathname === "/sales-orders" && query.status) {
    return `Opened ${label} · filtered`;
  }
  return `Opened ${label}`;
}
