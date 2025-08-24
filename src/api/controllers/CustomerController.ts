import { Request, Response } from 'express';
import { container } from '../../config/container';
import { CreateCustomer } from '../../application/CreateCustomer';
import { GetCustomers } from '../../application/GetCustomers';

export class CustomerController {
  async create(req: Request, res: Response) {
    try {
      const useCase = container.resolve(CreateCustomer);
      const orgId = req.headers['x-org-id'] as string || 'default-org'; // Default for testing
      const createdBy = 'system'; // Default for testing
      
      const customer = await useCase.execute(req.body, orgId, createdBy);
      
      res.status(201).json({
        success: true,
        data: customer
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const useCase = container.resolve(GetCustomers);
      const orgId = req.headers['x-org-id'] as string || 'default-org';
      const { id } = req.params;
      
      const customer = await useCase.findById(id, orgId);
      
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }
      
      res.json({
        success: true,
        data: customer
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const useCase = container.resolve(GetCustomers);
      const orgId = req.headers['x-org-id'] as string || 'default-org';
      
      const customers = await useCase.getAllActive(orgId);
      
      res.json({
        success: true,
        data: customers
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async search(req: Request, res: Response) {
    try {
      const useCase = container.resolve(GetCustomers);
      const orgId = req.headers['x-org-id'] as string || 'default-org';
      const { q, limit } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }
      
      const customers = await useCase.search(q, orgId, limit ? parseInt(limit as string) : undefined);
      
      res.json({
        success: true,
        data: customers
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const useCase = container.resolve(GetCustomers);
      const orgId = req.headers['x-org-id'] as string || 'default-org';
      const { id } = req.params;
      
      const stats = await useCase.getStats(id, orgId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}
