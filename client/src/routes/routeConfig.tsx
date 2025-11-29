import { ComponentType, lazy, LazyExoticComponent } from "react";
import { AppModule } from "../utils/roleAccess";

// Lazy load all pages for better performance
const CustomersPage = lazy(() => import("../pages/CustomersPage"));
const VendorsPage = lazy(() => import("../pages/VendorsPage"));
const BookingsPage = lazy(() => import("../pages/BookingsPage"));
const PaymentsPage = lazy(() => import("../pages/PaymentsPage"));
const ExpensesPage = lazy(() => import("../pages/ExpensesPage"));
const AuditLogsPage = lazy(() => import("../pages/AuditLogsPage"));
const UsersPage = lazy(() => import("../pages/UsersPage"));

export interface RouteConfig {
  path: string;
  module: AppModule;
  component: LazyExoticComponent<ComponentType>;
  label: string;
}

export const routes: RouteConfig[] = [
  {
    path: "/customers",
    module: "customers",
    component: CustomersPage,
    label: "Customers",
  },
  {
    path: "/vendors",
    module: "vendors",
    component: VendorsPage,
    label: "Vendors",
  },
  {
    path: "/bookings",
    module: "bookings",
    component: BookingsPage,
    label: "Bookings",
  },
  {
    path: "/payments",
    module: "payments",
    component: PaymentsPage,
    label: "Payments",
  },
  {
    path: "/expenses",
    module: "expenses",
    component: ExpensesPage,
    label: "Expenses",
  },
  {
    path: "/logs",
    module: "logs",
    component: AuditLogsPage,
    label: "Audit Logs",
  },
  {
    path: "/users",
    module: "users",
    component: UsersPage,
    label: "User Access",
  },
];

// Helper to get route by module
export const getRouteByModule = (module: AppModule): RouteConfig | undefined => {
  return routes.find((route) => route.module === module);
};

// Helper to get default route path
export const getDefaultPath = (): string => {
  return routes[0]?.path ?? "/customers";
};
