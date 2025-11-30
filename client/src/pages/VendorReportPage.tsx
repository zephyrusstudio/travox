import React from "react";
import VendorReport from "../components/reports/VendorReport";
import Layout from "../components/ui/Layout";

const VendorReportPage: React.FC = () => {
  return (
    <Layout currentPage="vendors">
      <VendorReport />
    </Layout>
  );
};

export default VendorReportPage;
