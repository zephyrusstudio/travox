import { injectable } from 'tsyringe';
import { IAuditLogRepository } from '../../../application/repositories/IAuditLogRepository';
import { AuditLog } from '../../../domain/AuditLog';
import { AuditLogModel } from '../../../models/mongoose/AuditLogModel';

@injectable()
export class AuditLogRepositoryMongo implements IAuditLogRepository {

  private toDomain(doc: any): AuditLog {
    return new AuditLog(
      doc._id.toString(),
      doc.orgId,
      doc.actorId,
      doc.entity,
      doc.entityId,
      doc.action,
      doc.diff,
      doc.ip,
      doc.userAgent,
      doc.createdAt
    );
  }

  async create(auditLog: AuditLog, orgId: string): Promise<AuditLog> {
    const doc = new AuditLogModel({
      orgId,
      actorId: auditLog.actorId,
      entity: auditLog.entity,
      entityId: auditLog.entityId,
      action: auditLog.action,
      diff: auditLog.diff,
      ip: auditLog.ip,
      userAgent: auditLog.userAgent,
      createdAt: new Date(),
    });

    const saved = await doc.save();
    auditLog.id = saved._id.toString();
    return auditLog;
  }

  async findByEntity(entity: string, entityId: string, orgId: string): Promise<AuditLog[]> {
    const docs = await AuditLogModel.find({ orgId, entity, entityId })
      .sort({ createdAt: -1 });
    return docs.map(doc => this.toDomain(doc));
  }

  async findByActor(actorId: string, orgId: string): Promise<AuditLog[]> {
    const docs = await AuditLogModel.find({ orgId, actorId })
      .sort({ createdAt: -1 });
    return docs.map(doc => this.toDomain(doc));
  }

  async findByDateRange(startDate: Date, endDate: Date, orgId: string): Promise<AuditLog[]> {
    const docs = await AuditLogModel.find({
      orgId,
      createdAt: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: -1 });
    return docs.map(doc => this.toDomain(doc));
  }

  async search(filters: {
    entity?: string;
    entityId?: string;
    actorId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }, orgId: string): Promise<{ logs: AuditLog[]; total: number; }> {
    const query: any = { orgId };

    if (filters.entity) {
      query.entity = filters.entity;
    }
    if (filters.entityId) {
      query.entityId = filters.entityId;
    }
    if (filters.actorId) {
      query.actorId = filters.actorId;
    }
    if (filters.action) {
      query.action = filters.action;
    }
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.createdAt.$lte = filters.endDate;
      }
    }

    const total = await AuditLogModel.countDocuments(query);

    let docsQuery = AuditLogModel.find(query).sort({ createdAt: -1 });

    if (filters.offset) {
      docsQuery = docsQuery.skip(filters.offset);
    }
    if (filters.limit) {
      docsQuery = docsQuery.limit(filters.limit);
    }

    const docs = await docsQuery.exec();
    const logs = docs.map(doc => this.toDomain(doc));

    return { logs, total };
  }

  async exportToCsv(filters: {
    entity?: string;
    actorId?: string;
    startDate?: Date;
    endDate?: Date;
  }, orgId: string): Promise<string> {
    const { logs } = await this.search(filters, orgId);
    
    const csvHeaders = 'ID,OrgID,ActorID,Entity,EntityID,Action,IP,UserAgent,CreatedAt,Diff\n';
    const csvRows = logs.map(log => {
      const escapedDiff = this.serializeDiff(log.diff).replace(/"/g, '""');
      const createdAt = log.createdAt instanceof Date 
        ? log.createdAt.toISOString() 
        : log.createdAt;
      return `"${log.id}","${log.orgId}","${log.actorId}","${log.entity}","${log.entityId}","${log.action}","${log.ip}","${log.userAgent}","${createdAt}","${escapedDiff}"`;
    }).join('\n');

    return csvHeaders + csvRows;
  }

  private serializeDiff(diff: unknown): string {
    if (diff === undefined) {
      return '';
    }

    try {
      return JSON.stringify(diff) ?? '';
    } catch {
      return '[Unserializable diff]';
    }
  }
}
