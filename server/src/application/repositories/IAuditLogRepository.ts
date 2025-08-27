import { AuditLog } from '../../domain/AuditLog';

export interface IAuditLogRepository {
  /**
   * Create a new audit log entry (immutable)
   */
  create(auditLog: AuditLog, orgId: string): Promise<AuditLog>;

  /**
   * Find audit logs by entity and entity ID
   */
  findByEntity(entity: string, entityId: string, orgId: string): Promise<AuditLog[]>;

  /**
   * Find audit logs by user/actor
   */
  findByActor(actorId: string, orgId: string): Promise<AuditLog[]>;

  /**
   * Find audit logs within a date range
   */
  findByDateRange(startDate: Date, endDate: Date, orgId: string): Promise<AuditLog[]>;

  /**
   * Search audit logs with filters
   */
  search(filters: {
    entity?: string;
    entityId?: string;
    actorId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }, orgId: string): Promise<{
    logs: AuditLog[];
    total: number;
  }>;

  /**
   * Export audit logs to CSV format
   */
  exportToCsv(filters: {
    entity?: string;
    actorId?: string;
    startDate?: Date;
    endDate?: Date;
  }, orgId: string): Promise<string>;
}
