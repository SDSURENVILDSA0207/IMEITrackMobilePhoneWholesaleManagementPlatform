import { z } from "zod";

import { PO_STATUSES } from "@/features/purchase-orders/types";

const itemSchema = z.object({
  brand: z.string().min(1, "Brand is required").max(100),
  model_name: z.string().min(1, "Model is required").max(150),
  storage: z.string().min(1, "Storage is required").max(50),
  color: z.string().min(1, "Color is required").max(50),
  expected_quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  unit_cost: z
    .string()
    .optional()
    .transform((v) => v ?? "")
    .refine(
      (v) => v.trim() === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0),
      "Enter a valid amount (0 or greater) or leave unit cost blank.",
    ),
});

export const poCreateSchema = z.object({
  po_number: z.string().min(1, "PO number is required").max(80),
  supplier_id: z.coerce.number().refine((n) => n > 0, "Select a supplier"),
  status: z.enum(PO_STATUSES),
  expected_delivery_date: z.string().optional().transform((v) => v ?? ""),
  notes: z.string().optional().transform((v) => v ?? ""),
  items: z.array(itemSchema).min(1, "Add at least one product line to this purchase order."),
});

export type PoCreateFormValues = z.infer<typeof poCreateSchema>;
