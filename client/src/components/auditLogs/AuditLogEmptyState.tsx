import { Activity } from "lucide-react";
import React from "react";

const AuditLogEmptyState: React.FC = () => {
  return (
    <div className="text-center py-12">
      <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        No Audit Logs Found
      </h3>
      <p className="text-gray-500 dark:text-gray-400">
        No audit logs match your current filters.
      </p>
    </div>
  );
};

export default AuditLogEmptyState;
