import type { PurchaseOrderCreatePayload } from "@/features/purchase-orders/types";
import type { PoCreateFormValues } from "@/features/purchase-orders/schemas/poCreateSchema";

export const defaultPoItemRow = {
  brand: "",
  model_name: "",
  storage: "",
  color: "",
  expected_quantity: 1,
  unit_cost: "",
};

export const defaultPoCreateFormValues: PoCreateFormValues = {
  po_number: "",
  supplier_id: 0,
  status: "draft",
  expected_delivery_date: "",
  notes: "",
  items: [{ ...defaultPoItemRow }],
};

export function poCreateFormToPayload(values: PoCreateFormValues): PurchaseOrderCreatePayload {
  return {
    po_number: values.po_number.trim(),
    supplier_id: values.supplier_id,
    status: values.status,
    expected_delivery_date: values.expected_delivery_date.trim() || null,
    notes: values.notes.trim() || null,
    items: values.items.map((row) => ({
      brand: row.brand.trim(),
      model_name: row.model_name.trim(),
      storage: row.storage.trim(),
      color: row.color.trim(),
      expected_quantity: row.expected_quantity,
      unit_cost: row.unit_cost.trim() === "" ? null : Number(row.unit_cost),
    })),
  };
}
