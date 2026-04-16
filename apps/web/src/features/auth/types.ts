export type LoginRequest = {
  email: string;
  password: string;
};

/** Matches FastAPI TokenResponse; refresh may be absent. */
export type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
};

export const USER_ROLES = ["admin", "inventory_manager", "sales_manager"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export type User = {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
};

export const AUTH_STORAGE_KEY = "imeitrack_auth";

/** Human-readable labels for the shell UI */
export function roleLabel(role: UserRole): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "inventory_manager":
      return "Inventory";
    case "sales_manager":
      return "Sales";
    default:
      return role;
  }
}
