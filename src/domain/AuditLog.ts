export class AuditLog {
  constructor(
    public id: string,
    public orgId: string,
    public actorId: string,
    public entity: string,
    public entityId: string,
    public action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW',
    public diff: Record<string, any>,
    public ip: string,
    public userAgent: string,
    public createdAt: Date = new Date()
  ) {}

  static create(
    orgId: string,
    actorId: string,
    entity: string,
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW',
    diff: Record<string, any>,
    ip: string,
    userAgent: string
  ): AuditLog {
    return new AuditLog(
      '',
      orgId,
      actorId,
      entity,
      entityId,
      action,
      diff,
      ip,
      userAgent,
      new Date()
    );
  }

  /**
   * Creates a diff object for CREATE operations
   */
  static createDiffForCreate(newData: any): Record<string, any> {
    return {
      before: null,
      after: newData
    };
  }

  /**
   * Creates a diff object for UPDATE operations
   */
  static createDiffForUpdate(before: any, after: any): Record<string, any> {
    return {
      before,
      after
    };
  }

  /**
   * Creates a diff object for DELETE operations
   */
  static createDiffForDelete(deletedData: any): Record<string, any> {
    return {
      before: deletedData,
      after: null
    };
  }
}
