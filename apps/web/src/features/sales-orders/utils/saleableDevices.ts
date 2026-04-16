import { listDevices } from "@/features/inventory/api";
import type { DeviceDetailed } from "@/features/inventory/types";

/** Devices the backend allows for allocation: `available` or `in_stock`. */
export async function fetchSaleableDevices(): Promise<DeviceDetailed[]> {
  const [available, inStock] = await Promise.all([
    listDevices({ status: "available" }),
    listDevices({ status: "in_stock" }),
  ]);
  const byId = new Map<number, DeviceDetailed>();
  for (const d of [...available, ...inStock]) {
    byId.set(d.id, d);
  }
  return Array.from(byId.values()).sort((a, b) => a.imei.localeCompare(b.imei));
}
