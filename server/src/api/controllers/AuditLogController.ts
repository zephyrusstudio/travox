import { Request, Response } from 'express';
import { container } from '../../config/container';
import { CreateAuditLog } from '../../application/useCases/auditLog/CreateAuditLog';
import { GetAuditLogs } from '../../application/useCases/auditLog/GetAuditLogs';

export class AuditLogController {
  async create(req: Request, res: Response) {
    try {
      const useCase = container.resolve(CreateAuditLog);
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';
      
      const auditLog = await useCase.execute({
        ...req.body,
        ip,
        userAgent
      }, req.user?.orgId!, req.user?.id!);
      
      res.status(201).json({
        status: 'success',
        data: auditLog.toApiResponse()
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const useCase = container.resolve(GetAuditLogs);
      
      const filters = {
        entity: req.query.entity as string,
        entityId: req.query.entityId as string,
        actorId: req.query.actorId as string,
        action: req.query.action as 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'LOGIN' | 'LOGOUT',
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      const result = await useCase.execute(filters, req.user?.orgId!);
      res.json({
        status: 'success',
        data: {
          logs: result.logs.map(log => log.toApiResponse()),
          total: result.total
        }
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async getByEntity(req: Request, res: Response) {
    try {
      const useCase = container.resolve(GetAuditLogs);
      const { entity, entityId } = req.params;
      
      const auditLogs = await useCase.getByEntity(entity, entityId, req.user?.orgId!);
      res.json({
        status: 'success',
        data: auditLogs.map(log => log.toApiResponse())
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async getByActor(req: Request, res: Response) {
    try {
      const useCase = container.resolve(GetAuditLogs);
      const { actorId } = req.params;
      
      const auditLogs = await useCase.getByActor(actorId, req.user?.orgId!);
      res.json({
        status: 'success',
        data: auditLogs.map(log => log.toApiResponse())
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async getByDateRange(req: Request, res: Response) {
    try {
      const useCase = container.resolve(GetAuditLogs);
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          status: 'error',
          data: { message: 'startDate and endDate are required' }
        });
      }

      const auditLogs = await useCase.getByDateRange(
        new Date(startDate as string),
        new Date(endDate as string),
        req.user?.orgId!
      );
      res.json({
        status: 'success',
        data: auditLogs.map(log => log.toApiResponse())
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async exportToCSV(req: Request, res: Response) {
    try {
      const useCase = container.resolve(GetAuditLogs);
      
      const filters = {
        entity: req.query.entity as string,
        entityId: req.query.entityId as string,
        actorId: req.query.actorId as string,
        action: req.query.action as 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'LOGIN' | 'LOGOUT',
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
      };

      const csv = await useCase.exportToCSV(filters, req.user?.orgId!);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }
}
