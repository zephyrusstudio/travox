import { Request, Response } from 'express';
import { container } from '../../config/container';
import { CreateVendor } from '../../application/useCases/vendor/CreateVendor';
import { UpdateVendor } from '../../application/useCases/vendor/UpdateVendor';
import { DeleteVendor } from '../../application/useCases/vendor/DeleteVendor';
import { GetVendors } from '../../application/useCases/vendor/GetVendors';
import { GetAccount } from '../../application/useCases/account/GetAccount';
import { ServiceType } from '../../models/FirestoreTypes';
import { shouldUnmask } from '../../utils/unmask';
import { setAuditContext } from '../../middleware/auditLogger';

export class VendorController {
  async create(req: Request, res: Response) {
    try {
      const useCase = container.resolve(CreateVendor);
      const orgId = req.user?.orgId!;
      const createdBy = req.user?.id!;
      const unmask = shouldUnmask(req);

      const vendor = await useCase.execute(req.body, orgId, createdBy);

      res.status(201).json({
        status: 'success',
        data: vendor.toApiResponse(unmask)
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
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      const unmask = shouldUnmask(req);

      const vendors = await useCase.execute(orgId, { limit, offset });
      const count = await useCase.count(orgId);
      res.json({
        status: 'success',
        data: vendors.map(v => v.toApiResponse(unmask)),
        count
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
      const unmask = shouldUnmask(req);

      const vendors = await useCase.search(query, orgId, { 
        serviceType: serviceType as ServiceType, 
        limit 
      });
      res.json({
        status: 'success',
        data: vendors.map(v => v.toApiResponse(unmask))
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
      const unmask = shouldUnmask(req);

      const vendor = await useCase.findById(vendorId, orgId);
      if (!vendor) {
        return res.status(404).json({
          status: 'error',
          data: { message: 'Vendor not found' }
        });
      }

      res.json({
        status: 'success',
        data: vendor.toApiResponse(unmask)
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

  async getAccount(req: Request, res: Response) {
    try {
      const vendorUseCase = container.resolve(GetVendors);
      const accountUseCase = container.resolve(GetAccount);
      const orgId = req.user?.orgId!;
      const vendorId = req.params.id;

      const vendor = await vendorUseCase.findById(vendorId, orgId);
      if (!vendor) {
        return res.status(404).json({
          status: 'error',
          data: { message: 'Vendor not found' }
        });
      }

      if (!vendor.accountId) {
        return res.status(404).json({
          status: 'error',
          data: { message: 'No account associated with this vendor' }
        });
      }

      const account = await accountUseCase.execute(vendor.accountId);
      if (!account) {
        return res.status(404).json({
          status: 'error',
          data: { message: 'Account not found' }
        });
      }

      res.json({
        status: 'success',
        data: account
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const getVendorsUseCase = container.resolve(GetVendors);
      const useCase = container.resolve(UpdateVendor);
      const orgId = req.user?.orgId!;
      const updatedBy = req.user?.id!;
      const { id } = req.params;
      const unmask = shouldUnmask(req);

      // Capture before state for audit log
      const beforeVendor = await getVendorsUseCase.findById(id, orgId);
      if (beforeVendor) {
        setAuditContext(req, 'vendors', id, beforeVendor.toApiResponse(unmask));
      }

      const vendor = await useCase.execute(id, req.body, orgId, updatedBy);

      res.json({
        status: 'success',
        data: vendor.toApiResponse(unmask)
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const getVendorsUseCase = container.resolve(GetVendors);
      const useCase = container.resolve(DeleteVendor);
      const orgId = req.user?.orgId!;
      const { id } = req.params;
      const unmask = shouldUnmask(req);

      // Capture before state for audit log
      const beforeVendor = await getVendorsUseCase.findById(id, orgId);
      if (beforeVendor) {
        setAuditContext(req, 'vendors', id, beforeVendor.toApiResponse(unmask));
      }

      await useCase.delete(id, orgId);

      res.json({
        status: 'success',
        data: { message: 'Vendor deleted successfully' }
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }
}
