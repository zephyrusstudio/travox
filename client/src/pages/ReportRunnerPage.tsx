import React from "react";
import { Navigate, useParams } from "react-router-dom";
import ReportRunner from "../components/reports/ReportRunner";
import Layout from "../components/ui/Layout";

const ReportRunnerPage: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();

  if (!reportId) {
    return <Navigate to="/reports" replace />;
  }

  if (reportId === "customer-report-existing") {
    return <Navigate to="/customers/report" replace />;
  }

  if (reportId === "vendor-report-existing") {
    return <Navigate to="/vendors/report" replace />;
  }

  return (
    <Layout currentPage="reports">
      <ReportRunner reportId={reportId} />
    </Layout>
  );
};

export default ReportRunnerPage;
