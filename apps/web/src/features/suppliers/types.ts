export const SUPPLIER_TYPES = ["manufacturer", "distributor", "wholesaler", "broker"] as const;
export type SupplierType = (typeof SUPPLIER_TYPES)[number];

export const SUPPLIER_TYPE_LABELS: Record<SupplierType, string> = {
  manufacturer: "Manufacturer",
  distributor: "Distributor",
  wholesaler: "Wholesaler",
  broker: "Broker",
};

export type Supplier = {
  id: number;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  supplier_type: SupplierType;
  payment_terms: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SupplierCreate = {
  name: string;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  supplier_type: SupplierType;
  payment_terms?: string | null;
  notes?: string | null;
  is_active: boolean;
};

export type SupplierUpdate = {
  name?: string | null;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  supplier_type?: SupplierType | null;
  payment_terms?: string | null;
  notes?: string | null;
  is_active?: boolean | null;
};
