import api from "@/shared/api/client";

import type {
  BatchDevicesResponse,
  Device,
  DeviceDetailed,
  IntakeDeviceBulkPayload,
  IntakeDevicePayload,
  InventoryBatch,
  ProductModel,
} from "./types";

export type ListDevicesParams = {
  brand?: string;
  model_name?: string;
  condition_grade?: string;
  lock_status?: string;
  status?: string;
};

function cleanParams(p: Record<string, string | undefined>) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(p)) {
    if (v !== undefined && v.trim() !== "") out[k] = v.trim();
  }
  return out;
}

export async function listDevices(params: ListDevicesParams = {}): Promise<DeviceDetailed[]> {
  const { data } = await api.get<DeviceDetailed[]>("/devices", {
    params: cleanParams({
      brand: params.brand,
      model_name: params.model_name,
      condition_grade: params.condition_grade,
      lock_status: params.lock_status,
      status: params.status,
    }),
  });
  return data;
}

export async function getDevice(deviceId: number): Promise<DeviceDetailed> {
  const { data } = await api.get<DeviceDetailed>(`/devices/${deviceId}`);
  return data;
}

export async function searchDeviceByImei(imei: string): Promise<DeviceDetailed> {
  const { data } = await api.get<DeviceDetailed>("/devices/search/by-imei", {
    params: { imei: imei.trim() },
  });
  return data;
}

export async function listProductModels(): Promise<ProductModel[]> {
  const { data } = await api.get<ProductModel[]>("/product-models");
  return data;
}

export async function getInventoryBatch(batchId: number): Promise<InventoryBatch> {
  const { data } = await api.get<InventoryBatch>(`/inventory-intake/batches/${batchId}`);
  return data;
}

export async function getBatchDevices(batchId: number): Promise<BatchDevicesResponse> {
  const { data } = await api.get<BatchDevicesResponse>(`/inventory-intake/batches/${batchId}/devices`);
  return data;
}

export async function addDeviceToBatch(batchId: number, payload: IntakeDevicePayload): Promise<Device> {
  const { data } = await api.post<Device>(`/inventory-intake/batches/${batchId}/devices`, payload);
  return data;
}

export async function bulkAddDevicesToBatch(
  batchId: number,
  payload: IntakeDeviceBulkPayload,
): Promise<Device[]> {
  const { data } = await api.post<Device[]>(`/inventory-intake/batches/${batchId}/devices/bulk`, payload);
  return data;
}
