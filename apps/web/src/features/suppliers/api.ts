import api from "@/shared/api/client";

import type { Supplier, SupplierCreate, SupplierUpdate } from "./types";

export type ListSuppliersParams = {
  search?: string;
  activeOnly?: boolean;
};

export async function listSuppliers(params: ListSuppliersParams = {}): Promise<Supplier[]> {
  const { data } = await api.get<Supplier[]>("/suppliers", {
    params: {
      search: params.search?.trim() || undefined,
      active_only: params.activeOnly ?? false,
    },
  });
  return data;
}

export async function getSupplier(id: number): Promise<Supplier> {
  const { data } = await api.get<Supplier>(`/suppliers/${id}`);
  return data;
}

export async function createSupplier(payload: SupplierCreate): Promise<Supplier> {
  const { data } = await api.post<Supplier>("/suppliers", payload);
  return data;
}

export async function updateSupplier(id: number, payload: SupplierUpdate): Promise<Supplier> {
  const { data } = await api.put<Supplier>(`/suppliers/${id}`, payload);
  return data;
}

/** Soft-deactivate (sets is_active=false). */
export async function deactivateSupplier(id: number): Promise<Supplier> {
  const { data } = await api.delete<Supplier>(`/suppliers/${id}`);
  return data;
}
