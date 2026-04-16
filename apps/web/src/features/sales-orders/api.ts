import api from "@/shared/api/client";

import type {
  SalesOrder,
  SalesOrderCreatePayload,
  SalesOrderDetailed,
  SalesOrderItemAddPayload,
  SalesOrderItemDetailed,
  SalesOrderStatus,
} from "./types";

export type ListSalesOrdersParams = {
  status?: string;
  customerId?: number;
};

export async function listSalesOrders(params: ListSalesOrdersParams = {}): Promise<SalesOrder[]> {
  const { data } = await api.get<SalesOrder[]>("/sales-orders", {
    params: {
      status: params.status || undefined,
      customer_id: params.customerId,
    },
  });
  return data;
}

export async function getSalesOrder(id: number): Promise<SalesOrderDetailed> {
  const { data } = await api.get<SalesOrderDetailed>(`/sales-orders/${id}`);
  return data;
}

export async function createSalesOrder(payload: SalesOrderCreatePayload): Promise<SalesOrder> {
  const { data } = await api.post<SalesOrder>("/sales-orders", payload);
  return data;
}

export async function updateSalesOrderStatus(id: number, status: SalesOrderStatus): Promise<SalesOrderDetailed> {
  const { data } = await api.patch<SalesOrderDetailed>(`/sales-orders/${id}/status`, { status });
  return data;
}

export async function addDeviceToSalesOrder(
  orderId: number,
  payload: SalesOrderItemAddPayload,
): Promise<SalesOrderItemDetailed> {
  const { data } = await api.post<SalesOrderItemDetailed>(`/sales-orders/${orderId}/devices`, payload);
  return data;
}

export async function bulkAddDevicesToSalesOrder(
  orderId: number,
  items: SalesOrderItemAddPayload[],
): Promise<SalesOrderItemDetailed[]> {
  const { data } = await api.post<SalesOrderItemDetailed[]>(`/sales-orders/${orderId}/devices/bulk`, {
    items,
  });
  return data;
}
