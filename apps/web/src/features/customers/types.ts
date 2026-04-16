/** API returns Decimals as JSON strings. */
export type Customer = {
  id: number;
  business_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  billing_address: string | null;
  shipping_address: string | null;
  credit_limit: string | null;
  outstanding_balance: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomerCreate = {
  business_name: string;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  billing_address?: string | null;
  shipping_address?: string | null;
  credit_limit?: number | null;
  outstanding_balance?: number | null;
  is_active: boolean;
  notes?: string | null;
};

export type CustomerUpdate = {
  business_name?: string | null;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  billing_address?: string | null;
  shipping_address?: string | null;
  credit_limit?: number | null;
  outstanding_balance?: number | null;
  is_active?: boolean | null;
  notes?: string | null;
};
