import React from "react";
import CustomerReport from "../components/reports/CustomerReport";
import Layout from "../components/ui/Layout";

const CustomerReportPage: React.FC = () => {
  return (
    <Layout currentPage="customers">
      <CustomerReport />
    </Layout>
  );
};

export default CustomerReportPage;
