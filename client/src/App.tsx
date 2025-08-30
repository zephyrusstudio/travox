import React, { useState } from "react";
import CustomerManagement from "./components/customers/CustomerManagement";
import TicketUploadManager from "./components/tickets/TicketUploadManager";
import Layout from "./components/ui/Layout";
import VendorManagement from "./components/vendors/VendorManagement";

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");

  // Show login form if user is not authenticated

  const renderCurrentPage = () => {
    switch (currentPage) {
      // case "dashboard":
      //   return <Dashboard />;
      case "customers":
        return <CustomerManagement />;
      case "vendors":
        return <VendorManagement />;
      // case "bookings":
      //   return <BookingManagement />;
      // case "payments":
      //   return <PaymentManagement />;
      // case "expenses":
      //   return <ExpenseManagement />;
      // case "refunds":
      //   return <RefundManagement />;
      // case "reports":
      //   return <ReportsManagement />;
      // case "settings":
      //   return <UserSettings />;
      // case "customer-ledger":
      //   return <CustomerLedger />;
      // case "vendor-ledger":
      //   return <VendorLedger />;
      // case "outstanding-payments":
      //   return <OutstandingPayments />;
      // case "monthly-summary":
      //   return <MonthlyIncomeExpense />;
      // case "gst-tax":
      //   return <GSTTaxView />;
      // case "calendar":
      //   return <CalendarView />;
      // case "revenue-details":
      //   return <DetailedRevenueView />;
      // case "bookings-details":
      //   return <DetailedBookingsView />;
      case "tickets":
        return <TicketUploadManager />;
      default:
        return <TicketUploadManager />;
    }
  };

  // Listen for hash changes to update current page
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) {
        setCurrentPage(hash);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange(); // Check initial hash

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return <Layout currentPage={currentPage}>{renderCurrentPage()}</Layout>;
};

function App() {
  return <AppContent />;
}

export default App;
