import { injectable, inject } from 'tsyringe';
import { IAuditLogRepository } from './Repositories/IAuditLogRepository';
import { AuditLog } from '../domain/AuditLog';

interface GetAuditLogsFilters {
  entity?: string;
  entityId?: string;
  actorId?: string;
  action?: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

@injectable()
export class GetAuditLogs {
  constructor(
    @inject('IAuditLogRepository') private auditLogRepo: IAuditLogRepository
  ) {}

  async execute(filters: GetAuditLogsFilters, orgId: string): Promise<{ logs: AuditLog[]; total: number }> {
    // Use the search method from the repository
    return await this.auditLogRepo.search({
      entity: filters.entity,
      entityId: filters.entityId,
      actorId: filters.actorId,
      action: filters.action,
      startDate: filters.startDate,
      endDate: filters.endDate,
      limit: filters.limit,
      offset: filters.offset
    }, orgId);
  }

  async getByEntity(entity: string, entityId: string, orgId: string): Promise<AuditLog[]> {
    return await this.auditLogRepo.findByEntity(entity, entityId, orgId);
  }

  async getByActor(actorId: string, orgId: string): Promise<AuditLog[]> {
    return await this.auditLogRepo.findByActor(actorId, orgId);
  }

  async getByDateRange(startDate: Date, endDate: Date, orgId: string): Promise<AuditLog[]> {
    return await this.auditLogRepo.findByDateRange(startDate, endDate, orgId);
  }

  async exportToCSV(filters: GetAuditLogsFilters, orgId: string): Promise<string> {
    return await this.auditLogRepo.exportToCsv({
      entity: filters.entity,
      actorId: filters.actorId,
      startDate: filters.startDate,
      endDate: filters.endDate
    }, orgId);
  }
}
