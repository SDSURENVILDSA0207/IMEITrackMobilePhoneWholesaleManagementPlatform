import type { Device } from "@/features/inventory/types";
import type { SalesOrder } from "@/features/sales-orders/types";

export const RETURN_REQUEST_STATUSES = [
  "requested",
  "approved",
  "rejected",
  "repaired",
  "replaced",
  "refunded",
] as const;
export type ReturnRequestStatus = (typeof RETURN_REQUEST_STATUSES)[number];

export type ReturnRequest = {
  id: number;
  sales_order_id: number;
  device_id: number;
  reason: string | null;
  issue_description: string | null;
  status: ReturnRequestStatus;
  resolution_notes: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReturnRequestDetailed = ReturnRequest & {
  sales_order: SalesOrder | null;
  device: Device | null;
};

export type ReturnRequestCreatePayload = {
  sales_order_id: number;
  device_id: number;
  reason: string | null;
  issue_description: string | null;
  status?: ReturnRequestStatus;
};

export type ReturnRequestStatusUpdatePayload = {
  status: ReturnRequestStatus;
  resolution_notes?: string | null;
};
