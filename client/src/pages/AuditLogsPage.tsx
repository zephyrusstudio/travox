import React from "react";
import AuditLogsManagement from "../components/auditLogs/AuditLogsManagement";
import Layout from "../components/ui/Layout";

const AuditLogsPage: React.FC = () => {
  return (
    <Layout currentPage="logs">
      <AuditLogsManagement />
    </Layout>
  );
};

export default AuditLogsPage;
