import React from "react";
import { Navigate, useParams } from "react-router-dom";
import ReportRunner from "../components/reports/ReportRunner";
import Layout from "../components/ui/Layout";

const ReportRunnerPage: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();

  if (!reportId) {
    return <Navigate to="/reports" replace />;
  }

  return (
    <Layout currentPage="reports">
      <ReportRunner reportId={reportId} />
    </Layout>
  );
};

export default ReportRunnerPage;

