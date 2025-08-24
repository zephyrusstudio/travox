import { injectable } from 'tsyringe';
import { firestore } from '../../config/firestore';
import { IAuditLogRepository } from '../../application/Repositories/IAuditLogRepository';
import { AuditLog } from '../../domain/AuditLog';
import { AuditLogDocument } from '../../models/FirestoreTypes';
import { Timestamp } from 'firebase-admin/firestore';

@injectable()
export class AuditLogRepositoryFirestore implements IAuditLogRepository {
  private collection = firestore.collection('audit_logs');

  async create(auditLog: AuditLog, orgId: string): Promise<AuditLog> {
    const doc: Omit<AuditLogDocument, 'id'> = {
      org_id: orgId,
      actor_id: auditLog.actorId,
      entity: auditLog.entity,
      entity_id: auditLog.entityId,
      action: auditLog.action,
      diff: auditLog.diff,
      ip: auditLog.ip,
      user_agent: auditLog.userAgent,
      created_at: Timestamp.fromDate(auditLog.createdAt)
    };

    const docRef = await this.collection.add(doc);
    auditLog.id = docRef.id;
    return auditLog;
  }

  async findByEntity(entity: string, entityId: string, orgId: string): Promise<AuditLog[]> {
    const querySnapshot = await this.collection
      .where('org_id', '==', orgId)
      .where('entity', '==', entity)
      .where('entity_id', '==', entityId)
      .orderBy('created_at', 'desc')
      .get();

    return querySnapshot.docs.map(doc => this.mapFirestoreToAuditLog(doc.data() as AuditLogDocument, doc.id));
  }

  async findByActor(actorId: string, orgId: string): Promise<AuditLog[]> {
    const querySnapshot = await this.collection
      .where('org_id', '==', orgId)
      .where('actor_id', '==', actorId)
      .orderBy('created_at', 'desc')
      .get();

    return querySnapshot.docs.map(doc => this.mapFirestoreToAuditLog(doc.data() as AuditLogDocument, doc.id));
  }

  async findByDateRange(startDate: Date, endDate: Date, orgId: string): Promise<AuditLog[]> {
    const querySnapshot = await this.collection
      .where('org_id', '==', orgId)
      .where('created_at', '>=', Timestamp.fromDate(startDate))
      .where('created_at', '<=', Timestamp.fromDate(endDate))
      .orderBy('created_at', 'desc')
      .get();

    return querySnapshot.docs.map(doc => this.mapFirestoreToAuditLog(doc.data() as AuditLogDocument, doc.id));
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
    let query = this.collection.where('org_id', '==', orgId);

    if (filters.entity) {
      query = query.where('entity', '==', filters.entity);
    }
    if (filters.entityId) {
      query = query.where('entity_id', '==', filters.entityId);
    }
    if (filters.actorId) {
      query = query.where('actor_id', '==', filters.actorId);
    }
    if (filters.action) {
      query = query.where('action', '==', filters.action);
    }
    if (filters.startDate) {
      query = query.where('created_at', '>=', Timestamp.fromDate(filters.startDate));
    }
    if (filters.endDate) {
      query = query.where('created_at', '<=', Timestamp.fromDate(filters.endDate));
    }

    query = query.orderBy('created_at', 'desc');

    // Get total count
    const countSnapshot = await query.get();
    const total = countSnapshot.size;

    // Apply pagination
    if (filters.offset) {
      query = query.offset(filters.offset);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const querySnapshot = await query.get();
    const logs = querySnapshot.docs.map(doc => this.mapFirestoreToAuditLog(doc.data() as AuditLogDocument, doc.id));

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
      const escapedDiff = JSON.stringify(log.diff).replace(/"/g, '""');
      return `"${log.id}","${log.orgId}","${log.actorId}","${log.entity}","${log.entityId}","${log.action}","${log.ip}","${log.userAgent}","${log.createdAt.toISOString()}","${escapedDiff}"`;
    }).join('\n');

    return csvHeaders + csvRows;
  }

  private mapFirestoreToAuditLog(doc: AuditLogDocument, id: string): AuditLog {
    return new AuditLog(
      id,
      doc.org_id,
      doc.actor_id,
      doc.entity,
      doc.entity_id,
      doc.action as 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW',
      doc.diff,
      doc.ip,
      doc.user_agent,
      doc.created_at.toDate()
    );
  }
}
