import type { DeviceConditionGrade, DeviceLockStatus, DeviceStatus } from "@/features/inventory/types";

export const CONDITION_LABELS: Record<DeviceConditionGrade, string> = {
  A: "Grade A",
  B: "Grade B",
  C: "Grade C",
  D: "Grade D",
};

export const LOCK_STATUS_LABELS: Record<DeviceLockStatus, string> = {
  unlocked: "Unlocked",
  carrier_locked: "Carrier locked",
  icloud_locked: "iCloud locked",
  mdm_locked: "MDM locked",
};

export const DEVICE_STATUS_LABELS: Record<DeviceStatus, string> = {
  available: "Available",
  in_stock: "In stock",
  reserved: "Reserved",
  sold: "Sold",
  return_requested: "Return requested",
  returned: "Returned",
};
