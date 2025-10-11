/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Bell,
  Building2,
  Calendar,
  ChevronDown,
  Clock,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Search,
  Upload,
  User,
  Users,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";
import { successToast } from "../../utils/toasts";

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
}

const sidebarItems = [
  // { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "tickets", label: "Ticket Upload", icon: Upload },
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
  // { id: "settings", label: "Settings", icon: Settings },
];

const Layout: React.FC<LayoutProps> = ({ children, currentPage }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["ledgers"]);
  const navigate = useNavigate();
  const { currentUser, authUser } = useApp();

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
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <LayoutDashboard className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xl font-bold text-white">Travox</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-6 px-3 pb-20 overflow-y-auto flex-1 min-h-0">
          {sidebarItems.map((item) => {
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
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:transform hover:scale-105"
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
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                {authUser?.photoURL ? (
                  <img
                    src={authUser.photoURL}
                    alt="Profile"
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <span className="text-sm font-bold text-white">
                    {currentUser?.username.charAt(0).toUpperCase()}
                  </span>
                )}
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
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 capitalize">
                  {currentPage.replace("-", " ")}
                </h1>
                <p className="text-sm text-gray-500">
                  {currentPage === "dashboard" &&
                    "Overview of your travel business"}
                  {currentPage === "tickets" &&
                    "AI-powered ticket processing and billing automation"}
                  {currentPage === "customers" &&
                    "Manage your customer database"}
                  {currentPage === "vendors" && "Manage service providers"}
                  {currentPage === "bookings" && "Track travel bookings"}
                  {currentPage === "payments" && "Monitor payment transactions"}
                  {currentPage === "expenses" && "Track business expenses"}
                  {currentPage === "refunds" && "Process customer refunds"}
                  {currentPage === "reports" && "Generate business reports"}
                  {currentPage === "settings" && "Configure your account"}
                  {currentPage === "customer-ledger" &&
                    "Customer account statements"}
                  {currentPage === "vendor-ledger" && "Vendor payment records"}
                  {currentPage === "outstanding-payments" &&
                    "Pending payment tracking"}
                  {currentPage === "monthly-summary" &&
                    "Monthly financial overview"}
                  {currentPage === "gst-tax" &&
                    "Tax compliance and GST reports"}
                  {currentPage === "calendar" && "Schedule and reminders"}
                  {currentPage === "logs" &&
                    "Audit logs and system activity tracking"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search anything..."
                  className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {currentUser?.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">
                        {currentUser?.username}
                      </p>
                      <p className="text-xs text-gray-500">
                        {currentUser?.email}
                      </p>
                    </div>
                    <a
                      href="#settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profile Settings
                    </a>
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
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 min-h-screen">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
