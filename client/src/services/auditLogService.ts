import { AuditLog } from '../types';
import { apiRequest } from '../utils/apiConnector';
import { toISTISOString, parseISTDate, getCurrentISTDate } from '../utils/timezone';

export interface AuditLogFilters {
  entity?: string;
  entityId?: string;
  actorId?: string;
  action?: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'LOGIN' | 'LOGOUT';
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
}

// Helper function to convert Firestore timestamp to ISO string
function convertFirestoreTimestamp(timestamp: { _seconds: number; _nanoseconds: number } | string | null | undefined): string {
  // Handle null/undefined cases
  if (!timestamp) {
    return toISTISOString(getCurrentISTDate()); // Return current time as fallback
  }

  // Handle string timestamps (already ISO format or date string)
  if (typeof timestamp === 'string') {
    try {
      const date = parseISTDate(timestamp);
      return toISTISOString(date);
    } catch {
      return toISTISOString(getCurrentISTDate());
    }
  }

  // Handle Firestore timestamp format
  if (typeof timestamp === 'object' && '_seconds' in timestamp) {
    try {
      // Validate that _seconds and _nanoseconds are valid numbers
      const seconds = Number(timestamp._seconds);
      const nanoseconds = Number(timestamp._nanoseconds || 0);
      
      if (isNaN(seconds) || isNaN(nanoseconds)) {
        return toISTISOString(getCurrentISTDate());
      }
      
      const milliseconds = seconds * 1000 + nanoseconds / 1000000;
      const date = new Date(milliseconds);
      
      // Check if the resulting date is valid
      if (isNaN(date.getTime())) {
        return toISTISOString(getCurrentISTDate());
      }
      
      return toISTISOString(date);
    } catch {
      return toISTISOString(getCurrentISTDate());
    }
  }

  // Fallback for any other format
  return toISTISOString(getCurrentISTDate());
}

// Interface for the API response log format
interface ApiAuditLog {
  id: string;
  orgId: string;
  actorId: string;
  entity: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'LOGIN' | 'LOGOUT';
  diff: Record<string, unknown>;
  ip: string;
  userAgent: string;
  createdAt: { _seconds: number; _nanoseconds: number } | string | null;
}

// Transform API response to our AuditLog interface
function transformAuditLog(apiLog: ApiAuditLog): AuditLog {
  try {
    const convertedTimestamp = convertFirestoreTimestamp(apiLog.createdAt);
    
    return {
      id: apiLog.id || 'unknown',
      orgId: apiLog.orgId || 'unknown',
      actorId: apiLog.actorId || 'unknown',
      entity: apiLog.entity || 'unknown',
      entityId: apiLog.entityId || 'unknown',
      action: apiLog.action || 'CREATE',
      diff: apiLog.diff || {},
      ip: apiLog.ip || 'unknown',
      userAgent: apiLog.userAgent || 'unknown',
      createdAt: convertedTimestamp,
      timestamp: convertedTimestamp, // For backward compatibility
      actorName: apiLog.actorId ? `User ${apiLog.actorId.slice(-4)}` : 'Unknown User'
    };
  } catch (error) {
    console.warn('Error transforming audit log:', error, apiLog);
    // Return a minimal audit log object with current timestamp in IST
    return {
      id: apiLog.id || 'unknown',
      orgId: apiLog.orgId || 'unknown',
      actorId: apiLog.actorId || 'unknown',
      entity: apiLog.entity || 'unknown',
      entityId: apiLog.entityId || 'unknown',
      action: 'CREATE',
      diff: {},
      ip: 'unknown',
      userAgent: 'unknown',
      createdAt: toISTISOString(getCurrentISTDate()),
      timestamp: toISTISOString(getCurrentISTDate()),
      actorName: 'Unknown User'
    };
  }
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
      if (filters.offset !== undefined) params.append('offset', filters.offset.toString());

      const queryString = params.toString();
      const url = `/audit-logs${queryString ? `?${queryString}` : ''}`;

      const response = await apiRequest({
        url: url,
        method: 'GET'
      });

      if (response.status === 'success') {
        // Ensure response.data.logs is an array
        const logs = Array.isArray(response.data.logs) ? response.data.logs : [];
        const transformedLogs = logs.map(transformAuditLog).filter(Boolean); // Filter out any null/undefined results
        
        return {
          logs: transformedLogs,
          total: response.data.total || 0
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

  async exportToCSV(filters: AuditLogFilters = {}): Promise<void> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (filters.entity) params.append('entity', filters.entity);
      if (filters.entityId) params.append('entityId', filters.entityId);
      if (filters.actorId) params.append('actorId', filters.actorId);
      if (filters.action) params.append('action', filters.action);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const queryString = params.toString();
      const url = `/audit-logs/export${queryString ? `?${queryString}` : ''}`;

      // Make API request to get CSV file
      const response = await apiRequest<Blob>({
        url: url,
        method: 'GET',
        responseType: 'blob',
      });

      // Create download link with IST date
      const blob = new Blob([response], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const downloadUrl = URL.createObjectURL(blob);
      const dateStr = toISTISOString(getCurrentISTDate()).split('T')[0];
      link.setAttribute('href', downloadUrl);
      link.setAttribute('download', `audit-logs-${dateStr}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Failed to export audit logs:', error);
      throw error;
    }
  }
};
