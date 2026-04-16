import type { Customer } from "@/features/customers/types";
import type { Device } from "@/features/inventory/types";

export const SALES_ORDER_STATUSES = [
  "draft",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type SalesOrderStatus = (typeof SALES_ORDER_STATUSES)[number];

export type SalesOrder = {
  id: number;
  customer_id: number;
  order_number: string;
  status: SalesOrderStatus;
  total_amount: string | null;
  notes: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
};

export type SalesOrderItem = {
  id: number;
  sales_order_id: number;
  device_id: number;
  selling_price: string;
  created_at: string;
  updated_at: string;
};

export type SalesOrderItemDetailed = SalesOrderItem & {
  device: Device | null;
};

export type SalesOrderDetailed = SalesOrder & {
  customer: Customer | null;
  items: SalesOrderItemDetailed[];
};

export type SalesOrderCreatePayload = {
  order_number: string;
  customer_id: number;
  status: SalesOrderStatus;
  notes: string | null;
};

export type SalesOrderItemAddPayload = {
  device_id: number;
  selling_price: number;
};
