import type { User } from "@/features/auth/types";

export function canCreateReturnRequest(user: User | null): boolean {
  if (!user) return false;
  return user.role === "admin" || user.role === "sales_manager" || user.role === "inventory_manager";
}

export function canUpdateReturnStatus(user: User | null): boolean {
  if (!user) return false;
  return user.role === "admin" || user.role === "inventory_manager";
}
