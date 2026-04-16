import { z } from "zod";

export const rmaCreateSchema = z.object({
  sales_order_id: z.coerce.number().refine((n) => n > 0, "Select a sales order"),
  device_id: z.coerce.number().refine((n) => n > 0, "Select a device from the order"),
  reason: z.string().min(1, "Enter a return reason").max(2000),
  issue_description: z.string().min(1, "Describe the issue").max(8000),
});

export type RmaCreateFormValues = z.infer<typeof rmaCreateSchema>;
