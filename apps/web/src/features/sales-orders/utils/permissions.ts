import type { User } from "@/features/auth/types";

export function canManageSalesOrders(user: User | null): boolean {
  if (!user) return false;
  return user.role === "admin" || user.role === "sales_manager";
}
