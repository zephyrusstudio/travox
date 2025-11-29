import React from "react";
import VendorManagement from "../components/vendors/VendorManagement";
import Layout from "../components/ui/Layout";

const VendorsPage: React.FC = () => {
  return (
    <Layout currentPage="vendors">
      <VendorManagement />
    </Layout>
  );
};

export default VendorsPage;
