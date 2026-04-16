import type { SalesOrderStatus } from "@/features/sales-orders/types";

export const SO_STATUS_LABELS: Record<SalesOrderStatus, string> = {
  draft: "Draft",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function soStatusBadgeClass(status: SalesOrderStatus): string {
  switch (status) {
    case "draft":
      return "bg-slate-100 text-slate-800 ring-slate-200";
    case "confirmed":
      return "bg-sky-50 text-sky-900 ring-sky-100";
    case "packed":
      return "bg-indigo-50 text-indigo-900 ring-indigo-100";
    case "shipped":
      return "bg-violet-50 text-violet-900 ring-violet-100";
    case "delivered":
      return "bg-emerald-50 text-emerald-900 ring-emerald-100";
    case "cancelled":
      return "bg-red-50 text-red-800 ring-red-100";
    default:
      return "bg-slate-50 text-slate-800 ring-slate-100";
  }
}
