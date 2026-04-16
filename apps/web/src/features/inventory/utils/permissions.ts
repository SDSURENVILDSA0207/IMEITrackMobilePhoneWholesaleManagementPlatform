import type { User } from "@/features/auth/types";

export function canManageInventory(user: User | null): boolean {
  if (!user) return false;
  return user.role === "admin" || user.role === "inventory_manager";
}
