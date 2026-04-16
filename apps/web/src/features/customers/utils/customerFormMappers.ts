import type { Customer, CustomerCreate, CustomerUpdate } from "@/features/customers/types";
import type { CustomerFormValues } from "@/features/customers/schemas/customerFormSchema";

export const defaultCustomerFormValues: CustomerFormValues = {
  business_name: "",
  contact_person: "",
  email: "",
  phone: "",
  billing_address: "",
  shipping_address: "",
  credit_limit: "",
  outstanding_balance: "0",
  notes: "",
  is_active: true,
};

function strOrNull(s: string): string | null {
  const x = s.trim();
  return x === "" ? null : x;
}

function moneyOrNull(s: string): number | null {
  const x = s.trim();
  if (x === "") return null;
  return Number(x);
}

export function customerToFormValues(c: Customer): CustomerFormValues {
  return {
    business_name: c.business_name,
    contact_person: c.contact_person ?? "",
    email: c.email ?? "",
    phone: c.phone ?? "",
    billing_address: c.billing_address ?? "",
    shipping_address: c.shipping_address ?? "",
    credit_limit: c.credit_limit ?? "",
    outstanding_balance: c.outstanding_balance ?? "0",
    notes: c.notes ?? "",
    is_active: c.is_active,
  };
}

export function formValuesToCreatePayload(values: CustomerFormValues): CustomerCreate {
  return {
    business_name: values.business_name.trim(),
    contact_person: strOrNull(values.contact_person),
    email: strOrNull(values.email),
    phone: strOrNull(values.phone),
    billing_address: strOrNull(values.billing_address),
    shipping_address: strOrNull(values.shipping_address),
    credit_limit: moneyOrNull(values.credit_limit),
    outstanding_balance: moneyOrNull(values.outstanding_balance) ?? 0,
    notes: strOrNull(values.notes),
    is_active: values.is_active,
  };
}

export function formValuesToUpdatePayload(values: CustomerFormValues): CustomerUpdate {
  return formValuesToCreatePayload(values) as CustomerUpdate;
}
