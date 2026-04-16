import api from "@/shared/api/client";

export async function listPurchaseOrders() {
  const { data } = await api.get("/purchase-orders");
  return data;
}
