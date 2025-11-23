import { Request, Response, NextFunction } from 'express';
import { container } from '../config/container';
import { IAuditLogRepository } from '../application/repositories/IAuditLogRepository';
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
 * Middleware to capture audit logs for CRUD operations (CREATE, UPDATE, DELETE only)
 * VIEW operations (GET requests) are not tracked in audit logs
 * Can work with or without authentication
 */
export function auditLogger(entity?: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Note: GET requests will be filtered out in logAuditEntry function
    const isReadOperation = req.method === 'GET';
    
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Capture the entity from the URL if not provided
    const entityFromUrl = entity || extractEntityFromUrl(req.path);
    
    // Initialize audit context
    req.auditContext = {
      entity: entityFromUrl
    };

    // Flag to prevent double logging (res.json calls res.send internally)
    let auditLogged = false;

    // Override response methods to capture the result
    res.send = function(data: any) {
      if (!auditLogged) {
        auditLogged = true;
        // Don't await - let it run in background to not delay response
        logAuditEntry(req, res, data).catch(err => {
          console.error('[Audit Middleware] Error in logAuditEntry:', err);
        });
      }
      return originalSend.call(this, data);
    };

    res.json = function(data: any) {
      if (!auditLogged) {
        auditLogged = true;
        // Don't await - let it run in background to not delay response
        logAuditEntry(req, res, data).catch(err => {
          console.error('[Audit Middleware] Error in logAuditEntry:', err);
        });
      }
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
    if (!req.auditContext?.entity) {
      return;
    }

    const auditRepo = container.resolve<IAuditLogRepository>('IAuditLogRepository');
    
    const action = getActionFromMethod(req.method, res.statusCode);
    
    // Skip audit logging for VIEW actions (GET requests) and failed operations
    if (action === null) {
      return;
    }
    
    const clientIp = getClientIp(req);
    const userAgent = req.get('User-Agent') || '';
    
    // Use authenticated user info if available, otherwise use system/anonymous
    const actorId = req.user?.sub || req.user?.id || 'system';
    const orgId = req.user?.orgId || 'default-org';
    
    // Extract actual data from response wrapper
    const actualResponseData = extractDataFromResponse(responseData);
    
    // Create diff based on operation type - store as JSON strings
    let diff: Record<string, any> = {};
    
    if (action === 'CREATE' && actualResponseData) {
      diff = {
        before: null,
        after: JSON.stringify(actualResponseData)
      };
    } else if (action === 'UPDATE' && req.auditContext.beforeData && actualResponseData) {
      diff = {
        before: JSON.stringify(req.auditContext.beforeData),
        after: JSON.stringify(actualResponseData)
      };
    } else if (action === 'DELETE' && req.auditContext.beforeData) {
      diff = {
        before: JSON.stringify(req.auditContext.beforeData),
        after: null
      };
    }

    const auditLog = AuditLog.create(
      orgId,
      actorId,
      req.auditContext.entity,
      req.auditContext.entityId || extractIdFromResponse(responseData) || 'unknown',
      action,
      diff,
      clientIp,
      userAgent
    );

    await auditRepo.create(auditLog, orgId);
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
  // Preserve existing audit context if it exists
  if (!req.auditContext) {
    req.auditContext = {};
  }
  
  req.auditContext = {
    ...req.auditContext,
    entity,
    entityId,
    beforeData
  };
}

function getActionFromMethod(method: string, statusCode: number): 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'LOGIN' | 'LOGOUT' | null {
  // Don't track GET requests or failed operations (these are considered VIEW operations)
  if (method.toUpperCase() === 'GET' || statusCode >= 400) {
    return null;
  }

  switch (method.toUpperCase()) {
    case 'POST':
      return 'CREATE';
    case 'PUT':
    case 'PATCH':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    default:
      return null;
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
    // Handle wrapped response format { status: 'success', data: {...} }
    const actualData = responseData.data || responseData;
    return actualData.id || actualData._id || actualData.customerId || actualData.vendorId;
  }
  
  return undefined;
}

/**
 * Extract actual data from standard API response format
 */
function extractDataFromResponse(responseData: any): any {
  if (!responseData) return undefined;
  
  // Handle standard response format { status: 'success', data: {...} }
  if (typeof responseData === 'object' && responseData.data !== undefined) {
    return responseData.data;
  }
  
  return responseData;
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
