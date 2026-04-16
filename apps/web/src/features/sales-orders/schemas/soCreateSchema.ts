import { z } from "zod";

import { SALES_ORDER_STATUSES } from "@/features/sales-orders/types";

export const soCreateSchema = z.object({
  order_number: z.string().min(1, "Enter an order number (e.g. SO-2026-001).").max(80),
  customer_id: z.coerce.number().refine((n) => n > 0, "Choose a customer to continue."),
  status: z.enum(SALES_ORDER_STATUSES),
  notes: z.string().optional().transform((v) => v ?? ""),
});

export type SoCreateFormValues = z.infer<typeof soCreateSchema>;
