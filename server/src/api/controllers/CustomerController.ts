import { Request, Response } from 'express';
import { container } from '../../config/container';
import { CreateCustomer } from '../../application/useCases/customer/CreateCustomer';
import { GetCustomers } from '../../application/useCases/customer/GetCustomers';

export class CustomerController {
  async create(req: Request, res: Response) {
    try {
      const useCase = container.resolve(CreateCustomer);
      const orgId = req.user?.orgId!;
      const createdBy = req.user?.id!;
      
      const customer = await useCase.execute(req.body, orgId, createdBy);
      
      res.status(201).json({
        status: 'success',
        data: customer.toApiResponse() // Use masked data
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const useCase = container.resolve(GetCustomers);
      const orgId = req.user?.orgId!;
      const { id } = req.params;
      
      const customer = await useCase.findById(id, orgId);
      
      if (!customer) {
        return res.status(404).json({
          status: 'error',
          data: { message: 'Customer not found' }
        });
      }
      
      res.json({
        status: 'success',
        data: customer.toApiResponse() // Use masked data
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const useCase = container.resolve(GetCustomers);
      const orgId = req.user?.orgId!;
      
      const customers = await useCase.getAllActive(orgId);
      
      res.json({
        status: 'success',
        data: customers.map(c => c.toApiResponse()) // Use masked data
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async search(req: Request, res: Response) {
    try {
      const useCase = container.resolve(GetCustomers);
      const orgId = req.user?.orgId!;
      const { q, limit } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          status: 'error',
          data: { message: 'Search query is required' }
        });
      }
      
      const customers = await useCase.search(q, orgId, limit ? parseInt(limit as string) : undefined);
      
      res.json({
        status: 'success',
        data: customers.map(c => c.toApiResponse()) // Use masked data
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const useCase = container.resolve(GetCustomers);
      const orgId = req.user?.orgId!;
      const { id } = req.params;
      
      const stats = await useCase.getStats(id, orgId);
      
      res.json({
        status: 'success',
        data: stats
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }
}
