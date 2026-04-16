import api from "@/shared/api/client";

import type {
  PurchaseOrderDetailed,
  PurchaseOrderCreatePayload,
  PurchaseOrderStatus,
  PurchaseOrderUpdatePayload,
  PurchaseOrderItem,
} from "./types";

export type ListPurchaseOrdersParams = {
  status?: string;
  supplierId?: number;
};

export async function listPurchaseOrders(params: ListPurchaseOrdersParams = {}): Promise<PurchaseOrderDetailed[]> {
  const { data } = await api.get<PurchaseOrderDetailed[]>("/purchase-orders", {
    params: {
      status: params.status || undefined,
      supplier_id: params.supplierId,
    },
  });
  return data;
}

export async function getPurchaseOrder(id: number): Promise<PurchaseOrderDetailed> {
  const { data } = await api.get<PurchaseOrderDetailed>(`/purchase-orders/${id}`);
  return data;
}

export async function createPurchaseOrder(payload: PurchaseOrderCreatePayload): Promise<PurchaseOrderDetailed> {
  const { data } = await api.post<PurchaseOrderDetailed>("/purchase-orders", payload);
  return data;
}

export async function updatePurchaseOrder(id: number, payload: PurchaseOrderUpdatePayload): Promise<PurchaseOrderDetailed> {
  const { data } = await api.put<PurchaseOrderDetailed>(`/purchase-orders/${id}`, payload);
  return data;
}

export async function updatePurchaseOrderStatus(
  id: number,
  status: PurchaseOrderStatus,
): Promise<PurchaseOrderDetailed> {
  const { data } = await api.patch<PurchaseOrderDetailed>(`/purchase-orders/${id}/status`, { status });
  return data;
}

export async function listPurchaseOrderItems(purchaseOrderId: number): Promise<PurchaseOrderItem[]> {
  const { data } = await api.get<PurchaseOrderItem[]>(`/purchase-orders/${purchaseOrderId}/items`);
  return data;
}
