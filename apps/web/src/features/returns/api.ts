import api from "@/shared/api/client";

import type {
  ReturnRequestCreatePayload,
  ReturnRequestDetailed,
  ReturnRequestStatus,
  ReturnRequestStatusUpdatePayload,
} from "./types";

export type ListReturnRequestsParams = {
  status?: ReturnRequestStatus;
  salesOrderId?: number;
  deviceId?: number;
};

export async function listReturnRequests(params: ListReturnRequestsParams = {}): Promise<ReturnRequestDetailed[]> {
  const { data } = await api.get<ReturnRequestDetailed[]>("/return-requests", {
    params: {
      status: params.status,
      sales_order_id: params.salesOrderId,
      device_id: params.deviceId,
    },
  });
  return data;
}

export async function getReturnRequest(id: number): Promise<ReturnRequestDetailed> {
  const { data } = await api.get<ReturnRequestDetailed>(`/return-requests/${id}`);
  return data;
}

export async function createReturnRequest(payload: ReturnRequestCreatePayload): Promise<ReturnRequestDetailed> {
  const { data } = await api.post<ReturnRequestDetailed>("/return-requests", {
    ...payload,
    status: payload.status ?? "requested",
  });
  return data;
}

export async function updateReturnRequestStatus(
  id: number,
  payload: ReturnRequestStatusUpdatePayload,
): Promise<ReturnRequestDetailed> {
  const { data } = await api.patch<ReturnRequestDetailed>(`/return-requests/${id}/status`, payload);
  return data;
}
