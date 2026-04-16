import api from "@/shared/api/client";

import type { Customer, CustomerCreate, CustomerUpdate } from "./types";

export type ListCustomersParams = {
  search?: string;
  activeOnly?: boolean;
};

export async function listCustomers(params: ListCustomersParams = {}): Promise<Customer[]> {
  const { data } = await api.get<Customer[]>("/customers", {
    params: {
      search: params.search?.trim() || undefined,
      active_only: params.activeOnly ?? false,
    },
  });
  return data;
}

export async function getCustomer(id: number): Promise<Customer> {
  const { data } = await api.get<Customer>(`/customers/${id}`);
  return data;
}

export async function createCustomer(payload: CustomerCreate): Promise<Customer> {
  const { data } = await api.post<Customer>("/customers", payload);
  return data;
}

export async function updateCustomer(id: number, payload: CustomerUpdate): Promise<Customer> {
  const { data } = await api.put<Customer>(`/customers/${id}`, payload);
  return data;
}
