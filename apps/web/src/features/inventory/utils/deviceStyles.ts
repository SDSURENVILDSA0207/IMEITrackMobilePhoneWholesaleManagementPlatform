import type { DeviceConditionGrade, DeviceLockStatus, DeviceStatus } from "@/features/inventory/types";

export function statusBadgeClass(status: DeviceStatus): string {
  switch (status) {
    case "available":
    case "in_stock":
      return "bg-emerald-50 text-emerald-900 ring-emerald-100";
    case "reserved":
      return "bg-amber-50 text-amber-900 ring-amber-100";
    case "sold":
      return "bg-slate-100 text-slate-800 ring-slate-200";
    case "return_requested":
      return "bg-orange-50 text-orange-900 ring-orange-100";
    case "returned":
      return "bg-violet-50 text-violet-900 ring-violet-100";
    default:
      return "bg-slate-50 text-slate-800 ring-slate-100";
  }
}

export function conditionBadgeClass(grade: DeviceConditionGrade): string {
  switch (grade) {
    case "A":
      return "bg-emerald-100 text-emerald-900";
    case "B":
      return "bg-sky-100 text-sky-900";
    case "C":
      return "bg-amber-100 text-amber-900";
    case "D":
      return "bg-slate-200 text-slate-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
}

export function lockBadgeClass(lock: DeviceLockStatus): string {
  return lock === "unlocked" ? "bg-slate-100 text-slate-700" : "bg-red-50 text-red-800 ring-1 ring-red-100";
}
