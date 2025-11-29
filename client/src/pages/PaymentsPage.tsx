import React from "react";
import PaymentManagement from "../components/payments/PaymentManagement";
import Layout from "../components/ui/Layout";

const PaymentsPage: React.FC = () => {
  return (
    <Layout currentPage="payments">
      <PaymentManagement />
    </Layout>
  );
};

export default PaymentsPage;
