import { Download, RefreshCw } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import {
  auditLogService,
  userService,
  User as UserType,
} from "../../services";
import { AuditLog } from "../../types";
import Button from "../ui/Button";
import Card, { CardContent } from "../ui/Card";
import Pagination from "../ui/Pagination";
import Spinner from "../ui/Spinner";
import AuditLogTable from "./AuditLogTable";
import AuditLogDetailModal from "./AuditLogDetailModal";
import AuditLogEmptyState from "./AuditLogEmptyState";

const AuditLogsManagement: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [users, setUsers] = useState<Map<string, UserType>>(new Map());
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const response = await auditLogService.getAuditLogs({
        limit: itemsPerPage,
        offset: offset,
      });

      setAuditLogs(response.logs);
      setTotal(response.total);

      const actorIds = [
        ...new Set(response.logs.map((log) => log.actorId).filter(Boolean)),
      ];
      if (actorIds.length > 0) {
        const userMap = await userService.getUsersByIds(actorIds);
        setUsers(userMap);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  const exportToCSV = async () => {
    try {
      await auditLogService.exportToCSV({});
    } catch (error) {
      console.error("Failed to export audit logs:", error);
    }
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedLog(null);
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Audit Logs</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track and monitor all system activities and changes
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={fetchAuditLogs}
            icon={RefreshCw}
            variant="outline"
            disabled={loading}
          >
            Refresh
          </Button>
          <Button variant="outline" onClick={exportToCSV} icon={Download}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Pagination */}
      {!loading && auditLogs.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={total}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemsPerPageOptions={[5, 10, 20, 50, 100]}
        />
      )}

      {/* Content */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="flex items-center space-x-3">
              <Spinner size="md" />
              <span className="text-gray-600 dark:text-gray-400">Loading audit logs...</span>
            </div>
          </CardContent>
        </Card>
      ) : auditLogs.length === 0 ? (
        <AuditLogEmptyState />
      ) : (
        <AuditLogTable
          auditLogs={auditLogs}
          total={total}
          users={users}
          onViewDetails={handleViewDetails}
        />
      )}

      {/* Detail Modal */}
      <AuditLogDetailModal
        isOpen={showDetailModal}
        onClose={handleCloseModal}
        log={selectedLog}
        users={users}
      />
    </div>
  );
};

export default AuditLogsManagement;
