import type { Supplier } from "@/features/suppliers/types";

export const PO_STATUSES = ["draft", "ordered", "partially_received", "received", "cancelled"] as const;
export type PurchaseOrderStatus = (typeof PO_STATUSES)[number];

export type PurchaseOrderItem = {
  id: number;
  purchase_order_id: number;
  brand: string;
  model_name: string;
  storage: string;
  color: string;
  expected_quantity: number;
  unit_cost: string | null;
  created_at: string;
  updated_at: string;
};

export type PurchaseOrder = {
  id: number;
  po_number: string;
  supplier_id: number;
  created_by: number | null;
  status: PurchaseOrderStatus;
  expected_delivery_date: string | null;
  notes: string | null;
  total_amount: string | null;
  created_at: string;
  updated_at: string;
};

export type PurchaseOrderDetailed = PurchaseOrder & {
  supplier: Supplier | null;
  items: PurchaseOrderItem[];
};

export type PurchaseOrderCreatePayload = {
  po_number: string;
  supplier_id: number;
  status: PurchaseOrderStatus;
  expected_delivery_date: string | null;
  notes: string | null;
  items: {
    brand: string;
    model_name: string;
    storage: string;
    color: string;
    expected_quantity: number;
    unit_cost: number | null;
  }[];
};

export type PurchaseOrderUpdatePayload = {
  po_number?: string | null;
  supplier_id?: number | null;
  expected_delivery_date?: string | null;
  notes?: string | null;
};
