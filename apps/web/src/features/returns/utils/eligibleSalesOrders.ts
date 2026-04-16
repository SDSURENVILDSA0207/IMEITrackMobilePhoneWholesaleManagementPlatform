import { listSalesOrders } from "@/features/sales-orders/api";
import type { SalesOrder } from "@/features/sales-orders/types";

/** Orders that are eligible for RMA per backend rules (shipped or delivered). */
export async function fetchEligibleSalesOrdersForRma(): Promise<SalesOrder[]> {
  const [shipped, delivered] = await Promise.all([
    listSalesOrders({ status: "shipped" }),
    listSalesOrders({ status: "delivered" }),
  ]);
  const byId = new Map<number, SalesOrder>();
  for (const o of [...shipped, ...delivered]) {
    byId.set(o.id, o);
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
}
