import React from "react";
import RefundManagement from "../components/refunds/RefundManagement";
import Layout from "../components/ui/Layout";

const RefundsPage: React.FC = () => {
  return (
    <Layout currentPage="refunds">
      <RefundManagement />
    </Layout>
  );
};

export default RefundsPage;
