import React from "react";
import CustomerManagement from "../components/customers/CustomerManagement";
import Layout from "../components/ui/Layout";

const CustomersPage: React.FC = () => {
  return (
    <Layout currentPage="customers">
      <CustomerManagement />
    </Layout>
  );
};

export default CustomersPage;
