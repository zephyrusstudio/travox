// src/App.tsx
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuditLogsManagement from "./components/auditLogs/AuditLogsManagement";
import AuthPage from "./components/auth/AuthPage";
import BookingManagement from "./components/bookings/BookingManagement";
import CustomerManagement from "./components/customers/CustomerManagement";
import ExpenseManagement from "./components/expenses/ExpenseManagement";
import PaymentManagement from "./components/payments/PaymentManagement";
import Layout from "./components/ui/Layout";
import UnsupportedDevice from "./components/ui/UnsupportedDevice";
import UserManagement from "./components/users/UserManagement";
import VendorManagement from "./components/vendors/VendorManagement";
import { useApp } from "./contexts/AppContext";
import PrivateRoute from "./routes/PrivateRoute";
import PublicRoute from "./routes/PublicRoute";
import {
  AppModule,
  getAccessibleModules,
  isAppModule,
} from "./utils/roleAccess";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768;
    }
    return false;
  });

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
};

const AppContent: React.FC = () => {
  const { currentUser } = useApp();
  const isMobile = useIsMobile();
  const accessibleModules = React.useMemo(
    () => getAccessibleModules(currentUser?.role),
    [currentUser?.role]
  );
  const defaultModule = accessibleModules[0] ?? "customers";

  const [currentPage, setCurrentPage] = React.useState<AppModule>(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (isAppModule(hash) && accessibleModules.includes(hash)) {
        return hash;
      }
    }
    return defaultModule;
  });

  // Show unsupported device message on mobile
  if (isMobile) {
    return <UnsupportedDevice />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "customers":
        return <CustomerManagement />;
      case "vendors":
        return <VendorManagement />;
      case "bookings":
        return <BookingManagement />;
      case "payments":
        return <PaymentManagement />;
      case "expenses":
        return <ExpenseManagement />;
      case "logs":
        return <AuditLogsManagement />;
      case "users":
        return <UserManagement />;
      default:
        return <CustomerManagement />;
    }
  };

  React.useEffect(() => {
    const handleHashChange = () => {
      if (typeof window === "undefined") return;

      const hash = window.location.hash.replace("#", "");

      if (isAppModule(hash) && accessibleModules.includes(hash)) {
        setCurrentPage(hash);
      } else if (accessibleModules.length > 0) {
        const fallback = accessibleModules[0];
        setCurrentPage(fallback);
        window.location.hash = `#${fallback}`;
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [accessibleModules]);

  React.useEffect(() => {
    if (!accessibleModules.includes(currentPage) && accessibleModules.length) {
      const fallback = accessibleModules[0];
      setCurrentPage(fallback);
      if (typeof window !== "undefined") {
        window.location.hash = `#${fallback}`;
      }
    }
  }, [accessibleModules, currentPage]);

  return <Layout currentPage={currentPage}>{renderCurrentPage()}</Layout>;
};

const ProtectedAppContent = PrivateRoute(AppContent);
const AuthOnly = PublicRoute(AuthPage);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthOnly />} />
        <Route path="/*" element={<ProtectedAppContent />} />
      </Routes>
    </BrowserRouter>
  );
}
