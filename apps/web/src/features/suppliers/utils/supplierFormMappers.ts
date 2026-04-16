import type { Supplier, SupplierCreate } from "@/features/suppliers/types";
import type { SupplierFormValues } from "@/features/suppliers/schemas/supplierFormSchema";

export const defaultSupplierFormValues: SupplierFormValues = {
  name: "",
  contact_person: "",
  email: "",
  phone: "",
  address: "",
  supplier_type: "wholesaler",
  payment_terms: "",
  notes: "",
  is_active: true,
};

export function supplierToFormValues(s: Supplier): SupplierFormValues {
  return {
    name: s.name,
    contact_person: s.contact_person ?? "",
    email: s.email ?? "",
    phone: s.phone ?? "",
    address: s.address ?? "",
    supplier_type: s.supplier_type,
    payment_terms: s.payment_terms ?? "",
    notes: s.notes ?? "",
    is_active: s.is_active,
  };
}

export function formValuesToPayload(values: SupplierFormValues): SupplierCreate {
  const t = (s: string) => {
    const x = s.trim();
    return x === "" ? null : x;
  };
  return {
    name: values.name.trim(),
    contact_person: t(values.contact_person),
    email: t(values.email),
    phone: t(values.phone),
    address: t(values.address),
    supplier_type: values.supplier_type,
    payment_terms: t(values.payment_terms),
    notes: t(values.notes),
    is_active: values.is_active,
  };
}
