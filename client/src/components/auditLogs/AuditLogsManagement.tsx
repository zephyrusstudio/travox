import {
  Activity,
  Calendar,
  Download,
  Eye,
  Filter,
  RefreshCw,
  User,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import {
  AuditLogFilters,
  auditLogService,
  userService,
  User as UserType,
} from "../../services";
import { AuditLog } from "../../types";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card, { CardContent, CardHeader } from "../ui/Card";
import Modal from "../ui/Modal";
import Pagination from "../ui/Pagination";
import Spinner from "../ui/Spinner";

const AuditLogsManagement: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [users, setUsers] = useState<Map<string, UserType>>(new Map());
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch audit logs
  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const response = await auditLogService.getAuditLogs({
        ...filters,
        limit: itemsPerPage,
        offset: offset,
      });

      setAuditLogs(response.logs);
      setTotal(response.total);

      // Dereference actor IDs to get user names
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
  }, [filters, currentPage, itemsPerPage]);

  // Export to CSV
  const exportToCSV = async () => {
    try {
      // Call API endpoint to export CSV with current filters
      await auditLogService.exportToCSV(filters);
    } catch (error) {
      console.error("Failed to export audit logs:", error);
    }
  };

  // Format JSON for display
  const formatJsonForDisplay = (
    value: string | object | null | undefined
  ): string => {
    if (value === null || value === undefined) {
      return "null";
    }

    // If it's already an object, stringify it with formatting
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }

    // If it's a string, try to parse and re-stringify it
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return JSON.stringify(parsed, null, 2);
      } catch {
        // If it's not valid JSON, return as-is but with some basic formatting
        return value;
      }
    }

    // For other types, convert to string
    return String(value);
  };

  // Get action variant for Badge
  const getActionVariant = (
    action: string
  ): "default" | "success" | "info" | "danger" => {
    switch (action) {
      case "CREATE":
        return "success";
      case "UPDATE":
        return "info";
      case "DELETE":
        return "danger";
      case "VIEW":
        return "default";
      default:
        return "default";
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return timestamp;
    
    // Use local date components
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const shortYear = String(date.getFullYear()).slice(-2);
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const time = `${String(displayHours).padStart(2, "0")}:${minutes}:${seconds} ${ampm}`;
    
    return `${day}/${month}/${shortYear} - ${time}`;
  };

  // Get user display name
  const getUserDisplayName = (
    actorId: string
  ): { name: string; email?: string } => {
    const user = users.get(actorId);
    if (user) {
      return {
        name: user.name || user.email || "Unknown User",
        email: user.email,
      };
    }
    return { name: "Unknown User" };
  };

  // Handle filter change
  const handleFilterChange = (key: keyof AuditLogFilters, value: string) => {
    setFilters((prev: AuditLogFilters) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({});
    setCurrentPage(1);
    fetchAuditLogs();
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600">
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
          {/*<Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            icon={Filter}
          >
            Filters
          </Button>*/}
          <Button
            variant="outline"
            onClick={exportToCSV}
            icon={Download}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entity
                </label>
                <select
                  value={filters.entity || ""}
                  onChange={(e) => handleFilterChange("entity", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Entities</option>
                  <option value="customers">Customers</option>
                  <option value="vendors">Vendors</option>
                  <option value="bookings">Bookings</option>
                  <option value="payments">Payments</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action
                </label>
                <select
                  value={filters.action || ""}
                  onChange={(e) => handleFilterChange("action", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Actions</option>
                  <option value="CREATE">Create</option>
                  <option value="UPDATE">Update</option>
                  <option value="DELETE">Delete</option>
                  <option value="VIEW">View</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate || ""}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate || ""}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-4 flex items-center space-x-4">
                <Button variant="outline" onClick={clearFilters} size="sm" icon={X}>
                  Clear All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Audit Logs Table */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="flex items-center space-x-3">
              <Spinner size="md" />
              <span className="text-gray-600">Loading audit logs...</span>
            </div>
          </CardContent>
        </Card>
      ) : auditLogs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Audit Logs Found
              </h3>
              <p className="text-gray-500">
                No audit logs match your current filters.
              </p>
            </div>
          ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Audit Logs</h3>
              <div className="text-sm text-gray-500">
                Showing {auditLogs.length} of {total} records
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actor
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditLogs.map((log) => {
                    return (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            {formatTimestamp(log.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Badge variant={getActionVariant(log.action)}>
                              {log.action}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium uppercase">
                              {log.entity}
                            </div>
                            {log.entityId && log.entityId !== "unknown" && (
                              <div className="text-gray-500 text-xs">
                                ID: {log.entityId}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <div>
                              {(() => {
                                const userInfo = getUserDisplayName(
                                  log.actorId
                                );
                                return (
                                  <>
                                    <div className="font-medium">
                                      {userInfo.name}
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedLog(log);
                              setShowDetailModal(true);
                            }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors duration-200"
                          >
                            <Eye className="w-4 h-4" />
                            Show Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedLog && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedLog(null);
          }}
          title="Audit Log Details"
          size="xl"
        >
          <div className="max-w-full">
            <div className="space-y-6">
              {/* Header Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-semibold text-gray-900 uppercase">
                        {selectedLog.entity}
                      </span>
                      <Badge variant={getActionVariant(selectedLog.action)} className="text-sm">
                        {selectedLog.action}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{formatTimestamp(selectedLog.createdAt)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 mb-1">Performed by</div>
                    <div className="flex items-center gap-2 justify-end">
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-gray-900">
                        {getUserDisplayName(selectedLog.actorId).name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Entity ID Card */}
              {selectedLog.entityId && selectedLog.entityId !== "unknown" && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Entity ID
                  </div>
                  <div className="font-mono text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200 break-all">
                    {selectedLog.entityId}
                  </div>
                </div>
              )}

              {/* Diff Details */}
              <div className="space-y-3">
                <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                  <div className="h-px flex-1 bg-gray-200"></div>
                  <span>Changes</span>
                  <div className="h-px flex-1 bg-gray-200"></div>
                </div>
                {selectedLog.diff && Object.keys(selectedLog.diff).length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {selectedLog.diff.before && (
                      <div className="bg-white border border-red-200 rounded-lg overflow-hidden">
                        <div className="bg-red-50 px-4 py-2 border-b border-red-200">
                          <span className="text-sm font-semibold text-red-700">Before</span>
                        </div>
                        <div className="p-4 max-h-96 overflow-auto">
                          <pre className="text-xs text-gray-800 font-mono leading-relaxed whitespace-pre-wrap break-all">
                            {formatJsonForDisplay(selectedLog.diff.before)}
                          </pre>
                        </div>
                      </div>
                    )}
                    {selectedLog.diff.after && (
                      <div className="bg-white border border-green-200 rounded-lg overflow-hidden">
                        <div className="bg-green-50 px-4 py-2 border-b border-green-200">
                          <span className="text-sm font-semibold text-green-700">After</span>
                        </div>
                        <div className="p-4 max-h-96 overflow-auto">
                          <pre className="text-xs text-gray-800 font-mono leading-relaxed whitespace-pre-wrap break-all">
                            {formatJsonForDisplay(selectedLog.diff.after)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                    <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No change data available</p>
                  </div>
                )}
              </div>

              {/* Metadata Footer */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      IP Address
                    </div>
                    <div className="font-mono text-sm text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                      {selectedLog.ip}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      User Agent
                    </div>
                    <div className="text-xs text-gray-700 bg-white px-3 py-2 rounded border border-gray-200 break-all line-clamp-2" title={selectedLog.userAgent}>
                      {selectedLog.userAgent}
                    </div>
                  </div>
                </div>
              </div>

              {/* Log ID Footer */}
              <div className="text-center pt-2 border-t border-gray-200">
                <div className="text-xs text-gray-400">
                  Log ID: <span className="font-mono">{selectedLog.id}</span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AuditLogsManagement;
