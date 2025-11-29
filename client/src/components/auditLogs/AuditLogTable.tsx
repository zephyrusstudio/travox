import { Calendar, Eye, User } from "lucide-react";
import React from "react";
import { AuditLog } from "../../types";
import { User as UserType } from "../../services";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card, { CardContent } from "../ui/Card";
import Table, { TableBody, TableCell, TableHeader, TableRow } from "../ui/Table";
import { formatTimestamp, getActionVariant, getUserDisplayName } from "../auditLogs/auditLogUtils";

interface AuditLogTableProps {
  auditLogs: AuditLog[];
  total: number;
  users: Map<string, UserType>;
  onViewDetails: (log: AuditLog) => void;
}

const AuditLogTable: React.FC<AuditLogTableProps> = ({
  auditLogs,
  users,
  onViewDetails,
}) => {
  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell header>Timestamp</TableCell>
              <TableCell header>Action</TableCell>
              <TableCell header>Entity</TableCell>
              <TableCell header>Actor</TableCell>
              <TableCell header>Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.map((log) => {
              const userInfo = getUserDisplayName(log.actorId, users);
              return (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2" />
                      {formatTimestamp(log.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActionVariant(log.action)}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium uppercase">{log.entity}</div>
                      {log.entityId && log.entityId !== "unknown" && (
                        <div className="text-gray-500 dark:text-gray-400 text-xs">
                          ID: {log.entityId}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2" />
                      <div className="font-medium">{userInfo.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => onViewDetails(log)}
                      variant="outline"
                      size="sm"
                      icon={Eye}
                    >
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AuditLogTable;
