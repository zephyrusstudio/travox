import { Request, Response, NextFunction } from 'express';
import { container } from '../config/container';
import { IAuditLogRepository } from '../application/Repositories/IAuditLogRepository';
import { AuditLog } from '../domain/AuditLog';

// Extend Request type to include audit context
declare module 'express-serve-static-core' {
  interface Request {
    auditContext?: {
      entity?: string;
      entityId?: string;
      beforeData?: any;
    };
  }
}

/**
 * Middleware to capture audit logs for all CRUD operations
 * Should be applied after authentication middleware so we have req.user
 */
export function auditLogger(entity?: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip audit logging for GET requests (unless explicitly specified)
    const isReadOperation = req.method === 'GET';
    
    // Only audit if user is authenticated
    if (!req.user) {
      return next();
    }

    const originalSend = res.send;
    const originalJson = res.json;
    
    // Capture the entity from the URL if not provided
    const entityFromUrl = entity || extractEntityFromUrl(req.path);
    
    // Initialize audit context
    req.auditContext = {
      entity: entityFromUrl
    };

    // Override response methods to capture the result
    res.send = function(data: any) {
      logAuditEntry(req, res, data);
      return originalSend.call(this, data);
    };

    res.json = function(data: any) {
      logAuditEntry(req, res, data);
      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Manually log an audit entry (useful for complex operations)
 */
export async function logAuditEntry(
  req: Request, 
  res: Response, 
  responseData?: any
): Promise<void> {
  try {
    if (!req.user || !req.auditContext?.entity) {
      return;
    }

    const auditRepo = container.resolve<IAuditLogRepository>('IAuditLogRepository');
    
    const action = getActionFromMethod(req.method, res.statusCode);
    const clientIp = getClientIp(req);
    const userAgent = req.get('User-Agent') || '';
    
    // Create diff based on operation type
    let diff: Record<string, any> = {};
    
    if (action === 'CREATE' && responseData) {
      diff = AuditLog.createDiffForCreate(responseData);
    } else if (action === 'UPDATE' && req.auditContext.beforeData && responseData) {
      diff = AuditLog.createDiffForUpdate(req.auditContext.beforeData, responseData);
    } else if (action === 'DELETE' && req.auditContext.beforeData) {
      diff = AuditLog.createDiffForDelete(req.auditContext.beforeData);
    } else if (action === 'VIEW') {
      diff = { accessed: true };
    }

    const auditLog = AuditLog.create(
      req.user.orgId || 'unknown',
      req.user.sub || req.user.id,
      req.auditContext.entity,
      req.auditContext.entityId || extractIdFromResponse(responseData) || 'unknown',
      action,
      diff,
      clientIp,
      userAgent
    );

    await auditRepo.create(auditLog, req.user.orgId || 'unknown');
  } catch (error) {
    // Don't fail the request if audit logging fails
    console.error('Audit logging failed:', error);
  }
}

/**
 * Set audit context for specific operations (call this in your use cases)
 */
export function setAuditContext(
  req: Request, 
  entity: string, 
  entityId?: string, 
  beforeData?: any
): void {
  req.auditContext = {
    entity,
    entityId,
    beforeData
  };
}

function getActionFromMethod(method: string, statusCode: number): 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' {
  if (statusCode >= 400) {
    return 'VIEW'; // Failed operations are logged as view attempts
  }

  switch (method.toUpperCase()) {
    case 'POST':
      return 'CREATE';
    case 'PUT':
    case 'PATCH':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    case 'GET':
    default:
      return 'VIEW';
  }
}

function extractEntityFromUrl(path: string): string {
  // Extract entity from URL patterns like /customers, /vendors, /users
  const segments = path.split('/').filter(Boolean);
  return segments[0] || 'unknown';
}

function extractIdFromResponse(responseData: any): string | undefined {
  if (!responseData) return undefined;
  
  // Try to extract ID from common response patterns
  if (typeof responseData === 'object') {
    return responseData.id || responseData._id || responseData.customerId || responseData.vendorId;
  }
  
  return undefined;
}

function getClientIp(req: Request): string {
  return (
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection as any)?.socket?.remoteAddress ||
    req.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    req.get('X-Real-IP') ||
    'unknown'
  );
}
