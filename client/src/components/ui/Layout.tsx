/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Building2,
  Calendar,
  ChevronDown,
  Clock,
  CreditCard,
  LogOut,
  Plane,
  Receipt,
  Shield,
  Users,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const { currentUser } = useApp();

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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-center h-16 px-6 bg-gradient-to-t from-blue-600 to-blue-700 relative" >
          
          {/* Content */}
          <div className="relative z-10 flex items-center space-x-3 mr-4">
            <Plane className="w-6 h-6 text-white" />
            <span className="text-xl font-bold text-white">Travox</span>
          </div>
        </div>

        <nav className="mt-6 px-3 pb-20 overflow-y-auto flex-1 min-h-0">
          {accessibleSidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isExpanded = expandedMenus.includes(item.id);
            const isSubmenuItemActive =
              hasSubmenu && isSubmenuActive(item.submenu);

            return (
              <div key={item.id} className="mb-2">
                {hasSubmenu ? (
                  <>
                    <button
                      onClick={() => toggleSubmenu(item.id)}
                      className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                        isSubmenuItemActive
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon
                          className={`w-5 h-5 mr-3 transition-transform duration-200 ${
                            isSubmenuItemActive
                              ? "text-white"
                              : "text-gray-500 group-hover:text-gray-700"
                          }`}
                        />
                        {item.label}
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        } ${
                          isSubmenuItemActive ? "text-white" : "text-gray-500"
                        }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="mt-2 ml-4 space-y-1">
                        {item.submenu.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = currentPage === subItem.id;

                          return (
                            <a
                              key={subItem.id}
                              href={`#${subItem.id}`}
                              className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                isSubActive
                                  ? "bg-blue-100 text-blue-700 border-l-2 border-blue-600"
                                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                              }`}
                            >
                              <SubIcon className="w-4 h-4 mr-3" />
                              {subItem.label}
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <a
                    href={`#${item.id}`}
                    className={`flex items-center px-4 py-3 mb-2 text-sm font-medium rounded-xl transition-all duration-200 group ${
                      isActive
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mr-3 transition-transform duration-200 ${
                        isActive
                          ? "text-white"
                          : "text-gray-500 group-hover:text-gray-700"
                      }`}
                    />
                    {item.label}
                  </a>
                )}
              </div>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-4 min-w-14 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-full flex items-center justify-center shadow-sm">
                {currentUser?.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {currentUser?.username}
                </p>
                <p className="text-xs text-gray-500 capitalize">
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
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
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
