import type { ReturnRequestStatus } from "@/features/returns/types";

export const RMA_STATUS_LABELS: Record<ReturnRequestStatus, string> = {
  requested: "Requested",
  approved: "Approved",
  rejected: "Rejected",
  repaired: "Repaired",
  replaced: "Replaced",
  refunded: "Refunded",
};

export function rmaStatusBadgeClass(status: ReturnRequestStatus): string {
  switch (status) {
    case "requested":
      return "bg-amber-50 text-amber-900 ring-amber-100";
    case "approved":
      return "bg-sky-50 text-sky-900 ring-sky-100";
    case "rejected":
      return "bg-red-50 text-red-800 ring-red-100";
    case "repaired":
    case "replaced":
      return "bg-indigo-50 text-indigo-900 ring-indigo-100";
    case "refunded":
      return "bg-emerald-50 text-emerald-900 ring-emerald-100";
    default:
      return "bg-slate-50 text-slate-800 ring-slate-100";
  }
}
