import { z } from "zod";

import { SUPPLIER_TYPES } from "@/features/suppliers/types";

export const supplierFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(255),
  contact_person: z.string().max(255).optional().transform((v) => v ?? ""),
  email: z
    .string()
    .max(255)
    .refine(
      (v) => {
        const t = v.trim();
        return t === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
      },
      { message: "Enter a valid email or leave blank" },
    ),
  phone: z.string().max(50).optional().transform((v) => v ?? ""),
  address: z.string().optional().transform((v) => v ?? ""),
  supplier_type: z.enum(SUPPLIER_TYPES),
  payment_terms: z.string().max(120).optional().transform((v) => v ?? ""),
  notes: z.string().optional().transform((v) => v ?? ""),
  is_active: z.boolean(),
});

export type SupplierFormValues = z.infer<typeof supplierFormSchema>;
