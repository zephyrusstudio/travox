import {
  Building2,
  Calendar,
  Clock,
  Command,
  CreditCard,
  FileText,
  LogOut,
  Menu,
  Moon,
  Receipt,
  RefreshCw,
  Shield,
  Sun,
  Users,
  X,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";
import { AppModule, canAccessModule } from "../../utils/roleAccess";
import { successToast } from "../../utils/toasts";
import { Breadcrumbs, CommandPalette, CommandItem, QuickActions } from "../../design-system/shell";
import MaintenanceBanner from "./MaintenanceBanner";
import Button from "./Button";

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
}

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  module?: AppModule;
  legacy?: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    title: "Operations",
    items: [
      { id: "customers", label: "Customers", icon: Users, to: "/customers", module: "customers" },
      { id: "vendors", label: "Vendors", icon: Building2, to: "/vendors", module: "vendors" },
      { id: "bookings", label: "Bookings", icon: Calendar, to: "/bookings", module: "bookings" },
    ],
  },
  {
    title: "Finance",
    items: [
      { id: "payments", label: "Payments", icon: CreditCard, to: "/payments", module: "payments" },
      { id: "expenses", label: "Expenses", icon: Receipt, to: "/expenses", module: "expenses" },
      { id: "refunds", label: "Refunds", icon: RefreshCw, to: "/refunds", module: "refunds" },
    ],
  },
  {
    title: "Reporting",
    items: [
      { id: "reports", label: "Reporting Center", icon: FileText, to: "/reports", module: "customers" },
      { id: "customers-report", label: "Customer Report", icon: FileText, to: "/customers/report", module: "customers" },
      { id: "vendors-report", label: "Vendor Report", icon: FileText, to: "/vendors/report", module: "vendors" },
    ],
  },
  {
    title: "Administration",
    items: [
      { id: "logs", label: "Audit Logs", icon: Clock, to: "/logs", module: "logs" },
      { id: "users", label: "User Access", icon: Shield, to: "/users", module: "users" },
    ],
  },
];

const routeNameMap: Record<string, string> = {
  customers: "Customers",
  vendors: "Vendors",
  bookings: "Bookings",
  payments: "Payments",
  expenses: "Expenses",
  refunds: "Refunds",
  logs: "Audit Logs",
  users: "User Access",
  reports: "Reporting Center",
  report: "Report",
  legacy: "Legacy",
  dashboard: "Dashboard",
  ledgers: "Ledgers",
  calendar: "Calendar",
  settings: "Settings",
  tickets: "Tickets / OCR",
};

const quickActionsByPage: Record<string, { id: string; label: string; to: string }[]> = {
  customers: [
    { id: "customer.create", label: "New Customer", to: "/customers" },
    { id: "customer.report", label: "Customer Report", to: "/customers/report" },
  ],
  vendors: [
    { id: "vendor.create", label: "New Vendor", to: "/vendors" },
    { id: "vendor.report", label: "Vendor Report", to: "/vendors/report" },
  ],
  bookings: [
    { id: "booking.create", label: "New Booking", to: "/bookings" },
    { id: "customer.create", label: "New Customer", to: "/customers" },
  ],
  payments: [
    { id: "payment.create", label: "Record Payment", to: "/payments" },
    { id: "expense.create", label: "Record Expense", to: "/expenses" },
    { id: "refund.create", label: "Create Refund", to: "/refunds" },
  ],
  expenses: [
    { id: "expense.create", label: "Record Expense", to: "/expenses" },
    { id: "payment.create", label: "Record Payment", to: "/payments" },
  ],
  refunds: [
    { id: "refund.create", label: "Create Refund", to: "/refunds" },
    { id: "payment.create", label: "Record Payment", to: "/payments" },
  ],
  reports: [
    { id: "report.center", label: "Reporting Center", to: "/reports" },
    { id: "customer.report", label: "Customer Report", to: "/customers/report" },
    { id: "vendor.report", label: "Vendor Report", to: "/vendors/report" },
  ],
};

const commandItems: CommandItem[] = [
  { id: "customers", label: "Open Customers", to: "/customers" },
  { id: "bookings", label: "Open Bookings", to: "/bookings" },
  { id: "vendors", label: "Open Vendors", to: "/vendors" },
  { id: "payments", label: "Open Payments", to: "/payments" },
  { id: "expenses", label: "Open Expenses", to: "/expenses" },
  { id: "refunds", label: "Open Refunds", to: "/refunds" },
  { id: "reports", label: "Open Reporting Center", to: "/reports" },
  { id: "customer-report", label: "Open Customer Report", to: "/customers/report" },
  { id: "vendor-report", label: "Open Vendor Report", to: "/vendors/report" },
  { id: "audit-logs", label: "Open Audit Logs", to: "/logs" },
  { id: "user-access", label: "Open User Access", to: "/users" },
];

const Layout: React.FC<LayoutProps> = ({ children, currentPage }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("travox-theme") === "true";
    }
    return false;
  });
  const [planeClickCount, setPlaneClickCount] = useState(0);
  const [darkModeUnlocked, setDarkModeUnlocked] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useApp();

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("travox-theme", String(darkMode));
  }, [darkMode]);

  React.useEffect(() => {
    if (planeClickCount >= 7) {
      setDarkModeUnlocked(true);
    }
  }, [planeClickCount]);

  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const accessibleGroups = useMemo(() => {
    return navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (!item.module) return true;
          return canAccessModule(currentUser?.role, item.module);
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [currentUser?.role]);

  const accessibleCommands = useMemo(() => {
    return commandItems.filter((item) => {
      const found = navGroups.flatMap((g) => g.items).find((gItem) => gItem.to === item.to);
      if (!found?.module) return true;
      return canAccessModule(currentUser?.role, found.module);
    });
  }, [currentUser?.role]);

  const breadcrumbs = useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);
    if (!segments.length) {
      return [{ label: "Home", href: "/customers" }];
    }

    let pathAccumulator = "";
    return segments.map((segment, index) => {
      pathAccumulator += `/${segment}`;
      const label = routeNameMap[segment] || segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        label,
        href: index < segments.length - 1 ? pathAccumulator : undefined,
      };
    });
  }, [location.pathname]);

  const quickActions = quickActionsByPage[currentPage] || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div
          className={`flex items-center justify-between h-16 px-6 relative ${
            darkMode
              ? "bg-gradient-to-t from-[var(--color-primary)] to-[var(--color-primary-strong)]"
              : "bg-white border-b border-gray-200"
          }`}
        >
          <button
            type="button"
            aria-label="Travox Logo"
            className="focus:outline-none"
            onClick={() => setPlaneClickCount((prev) => prev + 1)}
          >
            <img
              src="/brand/travox-logo.png"
              alt="Travox"
              className="h-8 w-auto"
            />
          </button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={Command}
              onClick={() => setCommandOpen(true)}
              className={darkMode ? "!text-white !border-white/20" : "!text-gray-700"}
              aria-label="Open command palette"
            />
            {darkModeUnlocked && (
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  darkMode
                    ? "text-white/80 hover:text-white hover:bg-white/10"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        <nav className="mt-4 overflow-y-auto flex-1 min-h-0 px-3 pb-4">
          {accessibleGroups.map((group) => (
            <div key={group.title} className="mb-5">
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to || currentPage === item.id;

                  return (
                    <Link
                      key={item.id}
                      to={item.to}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
                        isActive
                          ? "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-strong)] text-white shadow-lg"
                          : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 mr-3 ${
                          isActive ? "text-white" : "text-gray-500 dark:text-gray-400"
                        }`}
                      />
                      <span>{item.label}</span>
                      {item.legacy && (
                        <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${isActive ? "bg-white/20" : "bg-gray-200 dark:bg-gray-700"}`}>
                          Legacy
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 min-w-12 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-strong)] text-white font-bold rounded-full flex items-center justify-center shadow-sm">
                {currentUser?.username
                  .split(" ")
                  .map((word: string) => word.charAt(0).toUpperCase())
                  .join("")}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{currentUser?.username}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{currentUser?.role}</p>
              </div>
            </div>
            <Button
              onClick={() => {
                localStorage?.clear();
                sessionStorage?.clear();
                successToast("Logged out successfully");
                navigate("/");
                setTimeout(() => {
                  window.location.reload();
                }, 500);
              }}
              title="Logout"
              variant="ghost"
              icon={LogOut}
              size="vr"
            />
          </div>
        </div>
      </div>

      <Button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`lg:hidden fixed top-4 p-0 right-4 z-40 bg-[var(--color-primary)] hover:bg-[var(--color-primary-strong)] text-white shadow-md ${
          sidebarOpen ? "rotate-180" : ""
        } transition-transform duration-200`}
        icon={sidebarOpen ? X : Menu}
        variant={sidebarOpen ? "danger" : "primary"}
        size="md"
        aria-label="Toggle menu"
      />

      <div className="lg:pl-72 min-h-screen">
        <MaintenanceBanner
          isEnabled={import.meta.env.VITE_MAINTENANCE_MODE === "true"}
          message={import.meta.env.VITE_MAINTENANCE_MESSAGE}
          details={import.meta.env.VITE_MAINTENANCE_DETAILS}
        />

        <main className="p-4 sm:p-6 min-h-screen">
          <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Breadcrumbs items={breadcrumbs} />
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {routeNameMap[currentPage] || routeNameMap[location.pathname.split("/").filter(Boolean).pop() || ""] || "Workspace"}
              </h1>
            </div>
            {quickActions.length > 0 && <QuickActions actions={quickActions} />}
          </div>

          {children}
        </main>
      </div>

      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} commands={accessibleCommands} />
    </div>
  );
};

export default Layout;
