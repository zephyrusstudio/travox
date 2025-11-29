import { Activity, Calendar, User } from "lucide-react";
import React from "react";
import { AuditLog } from "../../types";
import { User as UserType } from "../../services";
import Badge from "../ui/Badge";
import Modal from "../ui/Modal";
import {
  formatTimestamp,
  formatJsonForDisplay,
  getActionVariant,
  getUserDisplayName,
} from "../auditLogs/auditLogUtils";

interface AuditLogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: AuditLog | null;
  users: Map<string, UserType>;
}

const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({
  isOpen,
  onClose,
  log,
  users,
}) => {
  if (!log) return null;

  const userInfo = getUserDisplayName(log.actorId, users);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Audit Log Details"
      size="xl"
    >
      <div className="max-w-full">
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 p-4 border border-blue-100 dark:border-blue-800">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 uppercase">
                    {log.entity}
                  </span>
                  <Badge
                    variant={getActionVariant(log.action)}
                    className="text-sm"
                  >
                    {log.action}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>{formatTimestamp(log.createdAt)}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Performed by
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {userInfo.name}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Entity ID Card */}
          {log.entityId && log.entityId !== "unknown" && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Entity ID
              </div>
              <div className="font-mono text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 break-all">
                {log.entityId}
              </div>
            </div>
          )}

          {/* Diff Details */}
          <DiffSection diff={log.diff} />

          {/* Metadata Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              User Agent
            </div>
            <div
              className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 break-all line-clamp-2"
              title={log.userAgent}
            >
              {log.userAgent}
            </div>
          </div>

          {/* Log ID Footer */}
          <div className="text-center pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-400 dark:text-gray-500">
              Log ID: <span className="font-mono">{log.id}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

interface DiffSectionProps {
  diff?: {
    before?: string | object | null;
    after?: string | object | null;
  };
}

const DiffSection: React.FC<DiffSectionProps> = ({ diff }) => {
  const hasDiff = diff && Object.keys(diff).length > 0;

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
        <span>Changes</span>
        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
      </div>

      {hasDiff ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {diff.before && <DiffPanel type="before" content={diff.before} />}
          {diff.after && <DiffPanel type="after" content={diff.after} />}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
          <p className="text-sm">No change data available</p>
        </div>
      )}
    </div>
  );
};

interface DiffPanelProps {
  type: "before" | "after";
  content: string | object | null;
}

const DiffPanel: React.FC<DiffPanelProps> = ({ type, content }) => {
  const isBefore = type === "before";
  const borderColor = isBefore
    ? "border-red-200 dark:border-red-800"
    : "border-green-200 dark:border-green-800";
  const headerBg = isBefore
    ? "bg-red-50 dark:bg-red-900/30"
    : "bg-green-50 dark:bg-green-900/30";
  const headerText = isBefore
    ? "text-red-700 dark:text-red-400"
    : "text-green-700 dark:text-green-400";
  const label = isBefore ? "Before" : "After";

  return (
    <div
      className={`bg-white dark:bg-gray-800 border ${borderColor} overflow-hidden`}
    >
      <div className={`${headerBg} px-4 py-2 border-b ${borderColor}`}>
        <span className={`text-sm font-semibold ${headerText}`}>{label}</span>
      </div>
      <div className="p-4 max-h-96 overflow-auto">
        <pre className="text-xs text-gray-800 dark:text-gray-200 font-mono leading-relaxed whitespace-pre-wrap break-all">
          {formatJsonForDisplay(content)}
        </pre>
      </div>
    </div>
  );
};

export default AuditLogDetailModal;
