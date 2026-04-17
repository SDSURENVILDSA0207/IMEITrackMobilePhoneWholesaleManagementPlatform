/**
 * URL query contract when the assistant navigates with page context.
 * List pages read these keys via useSearchParams; keep keys aligned with the API assistant.
 */
import { PO_STATUSES, type PurchaseOrderStatus } from "@/features/purchase-orders/types";
import { RETURN_REQUEST_STATUSES, type ReturnRequestStatus } from "@/features/returns/types";
import { SALES_ORDER_STATUSES, type SalesOrderStatus } from "@/features/sales-orders/types";

export const CopilotQueryKey = {
  imei: "imei",
  copilot: "copilot",
  sort: "sort",
  status: "status",
  customer: "customer",
  supplier: "supplier",
} as const;

export const CopilotQueryValue = {
  copilotLowStock: "low-stock",
  sortRecent: "recent",
} as const;

/** Semantic slug for analytics / future action handlers (optional on API responses). */
export type CopilotNavigateContext =
  | "none"
  | "low_stock"
  | "recent_sales"
  | "recent_purchase"
  | "returns_filtered"
  | "imei_search";

export function parseSalesOrderStatusFromQuery(value: string | null): SalesOrderStatus | "" {
  if (!value) return "";
  return (SALES_ORDER_STATUSES as readonly string[]).includes(value) ? (value as SalesOrderStatus) : "";
}

export function parsePurchaseOrderStatusFromQuery(value: string | null): PurchaseOrderStatus | "" {
  if (!value) return "";
  return (PO_STATUSES as readonly string[]).includes(value) ? (value as PurchaseOrderStatus) : "";
}

/** Natural-language "pending" maps to API status `requested`. */
export function parseReturnStatusFromQuery(value: string | null): ReturnRequestStatus | "" {
  if (!value) return "";
  const v = value.toLowerCase();
  if (v === "pending") return "requested";
  return (RETURN_REQUEST_STATUSES as readonly string[]).includes(v) ? (v as ReturnRequestStatus) : "";
}
