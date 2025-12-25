export type UserRole =
  | "Owner"
  | "Admin";

export const USER_ROLES: UserRole[] = [
  "Owner",
  "Admin",
];

export type AppModule =
  | "customers"
  | "vendors"
  | "bookings"
  | "payments"
  | "expenses"
  | "refunds"
  | "logs"
  | "users";

const MODULE_ACCESS: Record<AppModule, UserRole[]> = {
  customers: ["Owner", "Admin"],
  vendors: ["Owner", "Admin"],
  bookings: ["Owner", "Admin"],
  payments: ["Owner", "Admin"],
  expenses: ["Owner", "Admin"],
  refunds: ["Owner", "Admin"],
  logs: ["Owner"],
  users: ["Owner"],
};

export function normalizeRole(role?: string | null): UserRole {
  if (!role) return "Admin";

  const match = USER_ROLES.find(
    (known) => known.toLowerCase() === role.toLowerCase()
  );
  
  // Map old roles to new roles
  if (!match) {
    const lowerRole = role.toLowerCase();
    if (lowerRole === "ops" || lowerRole === "finance" || lowerRole === "agent" || lowerRole === "viewer") {
      return "Admin";
    }
  }
  
  return match ?? "Admin";
}

export function canAccessModule(
  role: string | undefined | null,
  module: AppModule
): boolean {
  const normalized = normalizeRole(role);
  if (normalized === "Owner") {
    return true;
  }

  const allowedRoles = MODULE_ACCESS[module] ?? [];
  return allowedRoles.includes(normalized);
}

export function getAccessibleModules(role?: string | null): AppModule[] {
  const normalized = normalizeRole(role);
  if (normalized === "Owner") {
    return [...Object.keys(MODULE_ACCESS)] as AppModule[];
  }

  return (Object.keys(MODULE_ACCESS) as AppModule[]).filter((module) =>
    MODULE_ACCESS[module]?.includes(normalized)
  );
}

export function isAppModule(
  value: string | null | undefined
): value is AppModule {
  if (!value) return false;
  return (Object.keys(MODULE_ACCESS) as AppModule[]).includes(
    value as AppModule
  );
}
