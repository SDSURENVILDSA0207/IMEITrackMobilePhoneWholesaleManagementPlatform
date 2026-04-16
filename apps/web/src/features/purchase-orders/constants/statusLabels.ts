import type { PurchaseOrderStatus } from "@/features/purchase-orders/types";

export const PO_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  draft: "Draft",
  ordered: "Ordered",
  partially_received: "Partially received",
  received: "Received",
  cancelled: "Cancelled",
};

export function poStatusBadgeClass(status: PurchaseOrderStatus): string {
  switch (status) {
    case "draft":
      return "bg-slate-100 text-slate-800 ring-slate-200";
    case "ordered":
      return "bg-sky-50 text-sky-900 ring-sky-100";
    case "partially_received":
      return "bg-amber-50 text-amber-900 ring-amber-100";
    case "received":
      return "bg-emerald-50 text-emerald-900 ring-emerald-100";
    case "cancelled":
      return "bg-red-50 text-red-800 ring-red-100";
    default:
      return "bg-slate-50 text-slate-800 ring-slate-100";
  }
}
