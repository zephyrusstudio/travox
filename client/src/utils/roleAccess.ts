export type UserRole =
  | "Owner"
  | "Admin"
  | "Ops"
  | "Finance"
  | "Agent"
  | "Viewer";

export const USER_ROLES: UserRole[] = [
  "Owner",
  "Admin",
  "Ops",
  "Finance",
  "Agent",
  "Viewer",
];

export type AppModule =
  | "customers"
  | "vendors"
  | "bookings"
  | "payments"
  | "expenses"
  | "logs"
  | "users";

const MODULE_ACCESS: Record<AppModule, UserRole[]> = {
  customers: ["Owner", "Admin", "Ops", "Finance", "Agent", "Viewer"],
  vendors: ["Owner", "Admin", "Ops", "Finance"],
  bookings: ["Owner", "Admin", "Ops", "Finance", "Agent", "Viewer"],
  payments: ["Owner", "Admin", "Finance"],
  expenses: ["Owner", "Admin", "Finance"],
  logs: ["Owner"],
  users: ["Owner", "Admin"],
};

export function normalizeRole(role?: string | null): UserRole {
  if (!role) return "Viewer";

  const match = USER_ROLES.find(
    (known) => known.toLowerCase() === role.toLowerCase()
  );
  return match ?? "Viewer";
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
