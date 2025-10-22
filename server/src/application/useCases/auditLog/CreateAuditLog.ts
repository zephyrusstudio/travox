import { injectable, inject } from 'tsyringe';
import { IAuditLogRepository } from '../../repositories/IAuditLogRepository';
import { AuditLog } from '../../../domain/AuditLog';

interface CreateAuditLogDTO {
  entity: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'LOGIN' | 'LOGOUT';
  diff: Record<string, any>;
  ip: string;
  userAgent: string;
}

@injectable()
export class CreateAuditLog {
  constructor(
    @inject('IAuditLogRepository') private auditLogRepo: IAuditLogRepository
  ) {}

  async execute(data: CreateAuditLogDTO, orgId: string, actorId: string): Promise<AuditLog> {
    // Validate required fields
    if (!data.entity || !data.entityId || !data.action) {
      throw new Error('Missing required fields: entity, entityId, action');
    }

    if (!['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'LOGIN', 'LOGOUT'].includes(data.action)) {
      throw new Error('Invalid action. Must be one of: CREATE, UPDATE, DELETE, STATUS_CHANGE, LOGIN, LOGOUT');
    }

    // Create audit log domain object
    const auditLog = AuditLog.create(
      orgId,
      actorId,
      data.entity,
      data.entityId,
      data.action,
      data.diff,
      data.ip,
      data.userAgent
    );

    // Save to repository
    return await this.auditLogRepo.create(auditLog, orgId);
  }

  // Helper methods for common audit log scenarios
  async logCreate(
    entity: string,
    entityId: string,
    newData: any,
    orgId: string,
    actorId: string,
    ip: string,
    userAgent: string
  ): Promise<AuditLog> {
    return this.execute({
      entity,
      entityId,
      action: 'CREATE',
      diff: AuditLog.createDiffForCreate(newData),
      ip,
      userAgent
    }, orgId, actorId);
  }

  async logUpdate(
    entity: string,
    entityId: string,
    oldData: any,
    newData: any,
    orgId: string,
    actorId: string,
    ip: string,
    userAgent: string
  ): Promise<AuditLog> {
    return this.execute({
      entity,
      entityId,
      action: 'UPDATE',
      diff: AuditLog.createDiffForUpdate(oldData, newData),
      ip,
      userAgent
    }, orgId, actorId);
  }

  async logDelete(
    entity: string,
    entityId: string,
    deletedData: any,
    orgId: string,
    actorId: string,
    ip: string,
    userAgent: string
  ): Promise<AuditLog> {
    return this.execute({
      entity,
      entityId,
      action: 'DELETE',
      diff: AuditLog.createDiffForDelete(deletedData),
      ip,
      userAgent
    }, orgId, actorId);
  }

  // logView method removed - VIEW actions are no longer tracked
}
