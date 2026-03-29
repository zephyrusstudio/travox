import React from "react";
import ReportingCenter from "../components/reports/ReportingCenter";
import Layout from "../components/ui/Layout";

const ReportsCenterPage: React.FC = () => {
  return (
    <Layout currentPage="reports">
      <ReportingCenter />
    </Layout>
  );
};

export default ReportsCenterPage;

