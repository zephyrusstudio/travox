import { Request, Response } from 'express';
import { container } from '../../config/container';
import { CreateVendor } from '../../application/useCases/vendor/CreateVendor';
import { GetVendors } from '../../application/useCases/vendor/GetVendors';
import { ServiceType } from '../../models/FirestoreTypes';

export class VendorController {
  async create(req: Request, res: Response) {
    try {
      const useCase = container.resolve(CreateVendor);
      const orgId = req.user?.orgId!;
      const createdBy = req.user?.id!;

      const vendor = await useCase.execute(req.body, orgId, createdBy);

      res.status(201).json({
        status: 'success',
        data: vendor
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
      const useCase = container.resolve(GetVendors);
      const orgId = req.user?.orgId!;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

      const vendors = await useCase.execute(orgId, { limit });
      res.json({
        status: 'success',
        data: vendors
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
      const useCase = container.resolve(GetVendors);
      const orgId = req.user?.orgId!;
      const query = req.query.q as string;
      const serviceType = req.query.serviceType as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

      const vendors = await useCase.search(query, orgId, { 
        serviceType: serviceType as ServiceType, 
        limit 
      });
      res.json({
        status: 'success',
        data: vendors
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const useCase = container.resolve(GetVendors);
      const orgId = req.user?.orgId!;
      const vendorId = req.params.id;

      const vendor = await useCase.findById(vendorId, orgId);
      if (!vendor) {
        return res.status(404).json({
          status: 'error',
          data: { message: 'Vendor not found' }
        });
      }

      res.json({
        status: 'success',
        data: vendor
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
      const useCase = container.resolve(GetVendors);
      const orgId = req.user?.orgId!;
      const vendorId = req.params.id;

      const stats = await useCase.getVendorStats(vendorId, orgId);
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
