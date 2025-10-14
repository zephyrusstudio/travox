import { AuditLog } from '../types';
import { apiRequest } from '../utils/apiConnector';

export interface AuditLogFilters {
  entity?: string;
  entityId?: string;
  actorId?: string;
  action?: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
  startDate?: string;
  endDate?: string;
  limit?: number;
  page?: number;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
}

// Helper function to convert Firestore timestamp to ISO string
function convertFirestoreTimestamp(timestamp: { _seconds: number; _nanoseconds: number }): string {
  return new Date(timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000).toISOString();
}

// Interface for the API response log format
interface ApiAuditLog {
  id: string;
  orgId: string;
  actorId: string;
  entity: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
  diff: Record<string, unknown>;
  ip: string;
  userAgent: string;
  createdAt: { _seconds: number; _nanoseconds: number };
}

// Transform API response to our AuditLog interface
function transformAuditLog(apiLog: ApiAuditLog): AuditLog {
  return {
    id: apiLog.id,
    orgId: apiLog.orgId,
    actorId: apiLog.actorId,
    entity: apiLog.entity,
    entityId: apiLog.entityId,
    action: apiLog.action,
    diff: apiLog.diff || {},
    ip: apiLog.ip,
    userAgent: apiLog.userAgent,
    createdAt: convertFirestoreTimestamp(apiLog.createdAt),
    timestamp: convertFirestoreTimestamp(apiLog.createdAt), // For backward compatibility
    actorName: `User ${apiLog.actorId.slice(-4)}` // Generate display name from ID
  };
}

export const auditLogService = {
  async getAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogsResponse> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (filters.entity) params.append('entity', filters.entity);
      if (filters.entityId) params.append('entityId', filters.entityId);
      if (filters.actorId) params.append('actorId', filters.actorId);
      if (filters.action) params.append('action', filters.action);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.page) params.append('page', filters.page.toString());

      const queryString = params.toString();
      const url = `/audit-logs${queryString ? `?${queryString}` : ''}`;

      const response = await apiRequest({
        url: url,
        method: 'GET'
      });

      if (response.status === 'success') {
        const transformedLogs = response.data.logs.map(transformAuditLog);
        return {
          logs: transformedLogs,
          total: response.data.total
        };
      } else {
        throw new Error(response.message || 'Failed to fetch audit logs');
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  },

  async getAuditLogsByEntity(entity: string, entityId: string): Promise<AuditLog[]> {
    const response = await this.getAuditLogs({ entity, entityId });
    return response.logs;
  },

  exportToCSV(logs: AuditLog[]): void {
    const sanitize = (value: string | number | null | undefined): string => {
      const stringValue = value === null || value === undefined ? '' : String(value);
      const escaped = stringValue.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const headers = ['Timestamp', 'Action', 'Entity', 'Actor'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log =>
        [
          sanitize(log.createdAt),
          sanitize(log.action),
          sanitize(log.entity),
          sanitize(log.actorName || log.actorId)
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
