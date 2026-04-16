import type { SalesOrderCreatePayload } from "@/features/sales-orders/types";
import type { SoCreateFormValues } from "@/features/sales-orders/schemas/soCreateSchema";

export const defaultSoCreateValues: SoCreateFormValues = {
  order_number: "",
  customer_id: 0,
  status: "draft",
  notes: "",
};

export function soCreateFormToPayload(values: SoCreateFormValues): SalesOrderCreatePayload {
  return {
    order_number: values.order_number.trim(),
    customer_id: values.customer_id,
    status: values.status,
    notes: values.notes.trim() || null,
  };
}
