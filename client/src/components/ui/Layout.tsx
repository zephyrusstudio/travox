/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Building2,
  Calendar,
  ChevronDown,
  Clock,
  CreditCard,
  LogOut,
  Moon,
  Plane,
  Receipt,
  Shield,
  Sun,
  Users,
} from "lucide-react";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";
import { AppModule, canAccessModule } from "../../utils/roleAccess";
import { successToast } from "../../utils/toasts";

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
}

type SidebarItem = {
  id: AppModule;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  submenu?: any[];
};

const sidebarItems: SidebarItem[] = [
  // { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  // { id: "tickets", label: "Ticket Upload", icon: Upload },
  // {
  //   id: "ledgers",
  //   label: "Ledgers & Reports",
  //   icon: BookOpen,
  //   submenu: [
  //     { id: "customer-ledger", label: "Customer Ledger", icon: Users },
  //     { id: "vendor-ledger", label: "Vendor Ledger", icon: Building2 },
  //     {
  //       id: "outstanding-payments",
  //       label: "Outstanding Payments",
  //       icon: AlertCircle,
  //     },
  //     { id: "monthly-summary", label: "Monthly Summary", icon: BarChart3 },
  //     { id: "gst-tax", label: "GST & Tax View", icon: Calculator },
  //   ],
  // },
  // { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "customers", label: "Customers", icon: Users },
  { id: "vendors", label: "Vendors", icon: Building2 },
  { id: "bookings", label: "Bookings", icon: Calendar },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "expenses", label: "Expenses", icon: Receipt },
  // { id: "refunds", label: "Refunds", icon: RefreshCw },
  // { id: "reports", label: "Reports", icon: FileText },
  { id: "logs", label: "Audit Logs", icon: Clock },
  { id: "users", label: "User Access", icon: Shield },
  // { id: "settings", label: "Settings", icon: Settings },
];

const Layout: React.FC<LayoutProps> = ({ children, currentPage }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["ledgers"]);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });
  const [planeClickCount, setPlaneClickCount] = useState(0);
  const [darkModeUnlocked, setDarkModeUnlocked] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useApp();

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  React.useEffect(() => {
    if (planeClickCount >= 7) {
      setDarkModeUnlocked(true);
    }
  }, [planeClickCount]);

  const accessibleSidebarItems = React.useMemo(
    () =>
      sidebarItems.filter((item) =>
        canAccessModule(currentUser?.role, item.id)
      ),
    [currentUser?.role]
  );

  const toggleSubmenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isSubmenuActive = (submenuItems: any[]) => {
    return submenuItems.some((item) => item.id === currentPage);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 bg-gradient-to-t from-blue-600 to-blue-700 relative" >
          <div className="relative z-10 flex items-center space-x-3">
            <button
              type="button"
              aria-label="Travox Plane"
              className="focus:outline-none"
              onClick={() => {
                setPlaneClickCount((prev) => prev + 1);
              }}
            >
              <Plane className="w-6 h-6 text-white" />
            </button>
            <span className="text-xl font-bold text-white">Travox</span>
          </div>
          {darkModeUnlocked && (
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          )}
        </div>

        <nav className="mt-6 pb-20 overflow-y-auto flex-1 min-h-0">
          {accessibleSidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isExpanded = expandedMenus.includes(item.id);
            const isSubmenuItemActive =
              hasSubmenu && isSubmenuActive(item.submenu!);

            return (
              <div key={item.id} className="mb-2">
                {hasSubmenu ? (
                  <>
                    <button
                      onClick={() => toggleSubmenu(item.id)}
                      className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium transition-all duration-200 group ${
                        isSubmenuItemActive
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                          : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon
                          className={`w-5 h-5 mr-3 transition-transform duration-200 ${
                            isSubmenuItemActive
                              ? "text-white"
                              : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200"
                          }`}
                        />
                        {item.label}
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        } ${
                          isSubmenuItemActive ? "text-white" : "text-gray-500 dark:text-gray-400"
                        }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="mt-2 ml-4 space-y-1">
                        {item.submenu!.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = currentPage === subItem.id;

                          return (
                            <Link
                              key={subItem.id}
                              to={`/${subItem.id}`}
                              className={`flex items-center px-4 py-2 text-sm font-medium transition-all duration-200 ${
                                isSubActive
                                  ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-l-2 border-blue-600"
                                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                              }`}
                            >
                              <SubIcon className="w-4 h-4 mr-3" />
                              {subItem.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={`/${item.id}`}
                    className={`flex items-center px-4 py-3 mb-2 text-sm font-medium transition-all duration-200 group ${
                      isActive
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mr-3 transition-transform duration-200 ${
                        isActive
                          ? "text-white"
                          : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200"
                      }`}
                    />
                    {item.label}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-4 min-w-14 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-full flex items-center justify-center shadow-sm">
                {currentUser?.username.split(" ").map((word: string) => word.charAt(0).toUpperCase()).join("")}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {currentUser?.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {currentUser?.role}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage?.clear();
                sessionStorage?.clear();
                successToast("Logged out successfully");
                navigate("/");
                setTimeout(() => {
                  window.location.reload();
                }, 500);
              }}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
              title="Logout"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 min-h-screen">
        {/* Page content */}
        <main className="p-6 min-h-screen">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
