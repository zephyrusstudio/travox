// src/App.tsx
import React, { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuditLogsManagement from "./components/auditLogs/AuditLogsManagement";
import AuthPage from "./components/auth/AuthPage";
import BookingManagement from "./components/bookings/BookingManagement";
import CustomerManagement from "./components/customers/CustomerManagement";
import Dashboard from "./components/dashboard/Dashboard";
import ExpenseManagement from "./components/expenses/ExpenseManagement";
import PaymentManagement from "./components/payments/PaymentManagement";
import TicketUploadManager from "./components/tickets/TicketUploadManager";
import Layout from "./components/ui/Layout";
import VendorManagement from "./components/vendors/VendorManagement";
import PrivateRoute from "./routes/PrivateRoute";
import PublicRoute from "./routes/PublicRoute";

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState("customers");

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
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
      case "tickets":
        return <TicketUploadManager />;
      case "logs":
        return <AuditLogsManagement />;
      default:
        return <CustomerManagement />;
    }
  };

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) setCurrentPage(hash);
    };
    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

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
