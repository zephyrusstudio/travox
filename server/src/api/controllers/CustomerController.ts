import { NextFunction, Request, Response } from 'express';
import { container } from '../../config/container';
import { CreateCustomer } from '../../application/useCases/customer/CreateCustomer';
import { UpdateCustomer } from '../../application/useCases/customer/UpdateCustomer';
import { GetCustomers } from '../../application/useCases/customer/GetCustomers';
import { DeleteCustomer } from '../../application/useCases/customer/DeleteCustomer';
import { GetCustomerPendingPaymentsReport } from '../../application/useCases/customer/GetCustomerPendingPaymentsReport';
import { GetBookings } from '../../application/useCases/booking/GetBookings';
import { GetAccount } from '../../application/useCases/account/GetAccount';
import { shouldUnmask } from '../../utils/unmask';
import { setAuditContext } from '../../middleware/auditLogger';

export class CustomerController {
  async create(req: Request, res: Response) {
    try {
      const useCase = container.resolve(CreateCustomer);
      const orgId = req.user?.orgId!;
      const createdBy = req.user?.id!;
      const unmask = shouldUnmask(req);
      
      const customer = await useCase.execute(req.body, orgId, createdBy);
      
      res.status(201).json({
        status: 'success',
        data: customer.toApiResponse(unmask)
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const getCustomersUseCase = container.resolve(GetCustomers);
      const useCase = container.resolve(UpdateCustomer);
      const orgId = req.user?.orgId!;
      const updatedBy = req.user?.id!;
      const { id } = req.params;
      const unmask = shouldUnmask(req);

      // Capture before state for audit log
      const beforeCustomer = await getCustomersUseCase.findById(id, orgId);
      if (beforeCustomer) {
        setAuditContext(req, 'customers', id, beforeCustomer.toApiResponse(unmask));
      }

      const customer = await useCase.execute(id, req.body, orgId, updatedBy);

      res.json({
        status: 'success',
        data: customer.toApiResponse(unmask)
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
      const unmask = shouldUnmask(req);
      
      const customer = await useCase.findById(id, orgId);
      
      if (!customer) {
        return res.status(404).json({
          status: 'error',
          data: { message: 'Customer not found' }
        });
      }
      
      res.json({
        status: 'success',
        data: customer.toApiResponse(unmask)
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
      const unmask = shouldUnmask(req);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      
      const customers = await useCase.getAllActive(orgId, limit, offset);
      const count = await useCase.countActive(orgId);
      
      res.json({
        status: 'success',
        data: customers.map(c => c.toApiResponse(unmask)),
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
      const useCase = container.resolve(GetCustomers);
      const orgId = req.user?.orgId!;
      const { q, name, email, phone, gstin } = req.query;
      const unmask = shouldUnmask(req);
      
      // Check if at least one search parameter is provided
      const hasSearchParams = q || name || email || phone || gstin;
      
      if (!hasSearchParams) {
        return res.status(400).json({
          status: 'error',
          data: { message: 'At least one search parameter is required (q, name, email, phone, or gstin)' }
        });
      }
      
      // Use advanced search - always searches all data for accurate results
      const customers = await useCase.advancedSearch(
        {
          q: q as string | undefined,
          name: name as string | undefined,
          email: email as string | undefined,
          phone: phone as string | undefined,
          gstin: gstin as string | undefined,
        },
        orgId
      );
      
      res.json({
        status: 'success',
        data: customers.map(c => c.toApiResponse(unmask))
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

  async listBookings(req: Request, res: Response) {
    try {
      const useCase = container.resolve(GetBookings);
      const orgId = req.user?.orgId!;
      const { id } = req.params;
      
      // First verify that the customer exists
      const customerUseCase = container.resolve(GetCustomers);
      const customer = await customerUseCase.findById(id, orgId);
      
      if (!customer) {
        return res.status(404).json({
          status: 'error',
          data: { message: 'Customer not found' }
        });
      }
      
      // Get bookings for this customer
      const bookings = await useCase.getByCustomerId(id, orgId);
      
      res.json({
        status: 'success',
        data: bookings
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
      const customerUseCase = container.resolve(GetCustomers);
      const accountUseCase = container.resolve(GetAccount);
      const orgId = req.user?.orgId!;
      const { id } = req.params;
      
      // First verify that the customer exists
      const customer = await customerUseCase.findById(id, orgId);
      
      if (!customer) {
        return res.status(404).json({
          status: 'error',
          data: { message: 'Customer not found' }
        });
      }
      
      // Check if customer has an account
      if (!customer.accountId) {
        return res.status(404).json({
          status: 'error',
          data: { message: 'No account associated with this customer' }
        });
      }
      
      // Get the account
      const account = await accountUseCase.execute(customer.accountId);
      
      if (!account) {
        return res.status(404).json({
          status: 'error',
          data: { message: 'Account not found' }
        });
      }
      
      // Verify the account belongs to the user's organization
      if (account.orgId !== orgId) {
        return res.status(403).json({
          status: 'error',
          data: { message: 'Access denied' }
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

  async softDelete(req: Request, res: Response) {
    try {
      const useCase = container.resolve(DeleteCustomer);
      const orgId = req.user?.orgId!;
      const { id } = req.params;

      await useCase.softDelete(id, orgId, req.user?.id!);

      res.json({
        status: 'success',
        data: { message: 'Customer soft deleted successfully' }
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const getCustomersUseCase = container.resolve(GetCustomers);
      const useCase = container.resolve(DeleteCustomer);
      const orgId = req.user?.orgId!;
      const { id } = req.params;
      const unmask = shouldUnmask(req);

      // Capture before state for audit log
      const beforeCustomer = await getCustomersUseCase.findById(id, orgId);
      if (beforeCustomer) {
        setAuditContext(req, 'customers', id, beforeCustomer.toApiResponse(unmask));
      }

      await useCase.delete(id, orgId);

      res.json({
        status: 'success',
        data: { message: 'Customer deleted successfully' }
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  /**
   * Get customers with bookings report
   * Query params:
   * - interval=startDate,endDate (both in ISO format or URL encoded)
   * - pending=true/false (optional, defaults to false - if true, only include bookings with pending payments)
   */
  async getBookingsReport(req: Request, res: Response) {
    try {
      const useCase = container.resolve(GetCustomerPendingPaymentsReport);
      const orgId = req.user?.orgId!;
      const interval = req.query.interval as string;
      const pendingOnly = req.query.pendingOnly as string === 'true';

      if (!interval) {
        return res.status(400).json({
          status: 'error',
          data: { message: 'interval query parameter is required (format: startDate,endDate)' }
        });
      }

      // Parse the interval - format: "startDate,endDate"
      const [startDateStr, endDateStr] = interval.split(',').map(s => s.trim());

      if (!startDateStr || !endDateStr) {
        return res.status(400).json({
          status: 'error',
          data: { message: 'Invalid interval format. Expected: startDate,endDate' }
        });
      }

      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
          status: 'error',
          data: { message: 'Invalid date format in interval. Please use ISO format.' }
        });
      }

      if (startDate > endDate) {
        return res.status(400).json({
          status: 'error',
          data: { message: 'Start date must be before or equal to end date' }
        });
      }

      // Normalize to start of day and end of day
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      const report = await useCase.execute(startDate, endDate, orgId, pendingOnly);

      res.json({
        status: 'success',
        data: report,
        count: report.length,
        pendingOnly,
        interval: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }
}
