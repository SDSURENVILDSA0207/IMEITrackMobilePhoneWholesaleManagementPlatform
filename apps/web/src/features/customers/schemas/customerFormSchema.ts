import { z } from "zod";

const moneyInput = () =>
  z
    .string()
    .optional()
    .transform((v) => v ?? "")
    .refine(
      (v) => v.trim() === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0),
      "Enter a valid non-negative amount or leave blank",
    );

export const customerFormSchema = z.object({
  business_name: z.string().min(2, "Business name must be at least 2 characters").max(255),
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
  billing_address: z.string().optional().transform((v) => v ?? ""),
  shipping_address: z.string().optional().transform((v) => v ?? ""),
  credit_limit: moneyInput(),
  outstanding_balance: moneyInput(),
  notes: z.string().optional().transform((v) => v ?? ""),
  is_active: z.boolean(),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;
