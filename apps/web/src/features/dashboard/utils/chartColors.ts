import type { ReturnRequestStatus } from "@/features/returns/types";

/** Bar fill for return request status rows. */
export function returnStatusBarClass(status: string): string {
  const s = status as ReturnRequestStatus;
  switch (s) {
    case "requested":
      return "bg-amber-400";
    case "approved":
      return "bg-sky-500";
    case "rejected":
      return "bg-red-400";
    case "repaired":
    case "replaced":
      return "bg-indigo-500";
    case "refunded":
      return "bg-emerald-500";
    default:
      return "bg-slate-400";
  }
}

/** Bar fill for device condition grade (A–D). */
export function conditionGradeBarClass(grade: string): string {
  switch (grade.toUpperCase()) {
    case "A":
      return "bg-emerald-500";
    case "B":
      return "bg-sky-500";
    case "C":
      return "bg-amber-400";
    case "D":
      return "bg-orange-500";
    default:
      return "bg-slate-400";
  }
}
