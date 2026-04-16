import type { Supplier } from "@/features/suppliers/types";

export const DEVICE_CONDITION_GRADES = ["A", "B", "C", "D"] as const;
export type DeviceConditionGrade = (typeof DEVICE_CONDITION_GRADES)[number];

export const DEVICE_LOCK_STATUSES = ["unlocked", "carrier_locked", "icloud_locked", "mdm_locked"] as const;
export type DeviceLockStatus = (typeof DEVICE_LOCK_STATUSES)[number];

export const DEVICE_STATUSES = [
  "available",
  "in_stock",
  "reserved",
  "sold",
  "return_requested",
  "returned",
] as const;
export type DeviceStatus = (typeof DEVICE_STATUSES)[number];

export type ProductModel = {
  id: number;
  brand: string;
  model_name: string;
  storage: string;
  color: string;
  default_condition_type: string | null;
  created_at: string;
  updated_at: string;
};

export type InventoryBatch = {
  id: number;
  batch_code: string;
  supplier_id: number;
  purchase_order_id: number | null;
  received_date: string | null;
  total_received: number;
  notes: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
};

export type Device = {
  id: number;
  product_model_id: number | null;
  condition_grade: DeviceConditionGrade;
  battery_health: number;
  lock_status: DeviceLockStatus;
  imei: string;
  purchase_cost: string | null;
  selling_price: string | null;
  status: DeviceStatus;
  source_batch_id: number | null;
  supplier_id: number | null;
  created_at: string;
  updated_at: string;
};

export type DeviceDetailed = Device & {
  product_model: ProductModel | null;
  source_batch: InventoryBatch | null;
  supplier: Supplier | null;
};

export type BatchDevicesResponse = {
  batch_id: number;
  total: number;
  devices: Device[];
};

export type IntakeDevicePayload = {
  imei: string;
  product_model_id: number;
  condition_grade: DeviceConditionGrade;
  battery_health: number;
  lock_status: DeviceLockStatus;
  purchase_cost?: number | null;
  selling_price?: number | null;
  status: DeviceStatus;
};

export type IntakeDeviceBulkPayload = {
  devices: IntakeDevicePayload[];
};
