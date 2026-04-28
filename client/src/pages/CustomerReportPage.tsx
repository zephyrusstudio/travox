import React from "react";
import CustomerReport from "../components/reports/CustomerReport";
import Layout from "../components/ui/Layout";

const CustomerReportPage: React.FC = () => {
  return (
    <Layout currentPage="customers-report">
      <CustomerReport />
    </Layout>
  );
};

export default CustomerReportPage;
