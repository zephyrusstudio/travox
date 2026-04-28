import { Request, Response } from 'express';
import { container } from '../../config/container';
import { CreateBooking } from '../../application/useCases/booking/CreateBooking';
import { GetBookings } from '../../application/useCases/booking/GetBookings';
import { UpdateBooking } from '../../application/useCases/booking/UpdateBooking';
import { DeleteBooking } from '../../application/useCases/booking/DeleteBooking';
import { BookingStatus } from '../../models/FirestoreTypes';
import { shouldUnmask } from '../../utils/unmask';
import { setAuditContext } from '../../middleware/auditLogger';

export class BookingController {
  async create(req: Request, res: Response) {
    try {
      const useCase = container.resolve(CreateBooking);
      const unmask = shouldUnmask(req);
      const booking = await useCase.execute(req.body, req.user?.orgId!, req.user?.id!);
      res.status(201).json({
        status: 'success',
        data: booking.toApiResponse(unmask)
      });
    } catch (error: any) {
      const statusCode = String(error?.message || '').startsWith('Duplicate booking warning') ? 409 : 400;
      res.status(statusCode).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const useCase = container.resolve(GetBookings);
      const unmask = shouldUnmask(req);
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;

      const bookings = await useCase.execute(req.user?.orgId!, limit, offset);
      const count = await useCase.count(req.user?.orgId!);
      res.json({
        status: 'success',
        data: bookings.map(b => b.toApiResponse(unmask)),
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
      const useCase = container.resolve(GetBookings);
      const unmask = shouldUnmask(req);
      
      const searchParams = {
        q: req.query.q as string,
        customerId: req.query.customerId as string,
        customerName: req.query.customerName as string,
        packageName: req.query.packageName as string,
        pnrNo: req.query.pnrNo as string,
        modeOfJourney: req.query.modeOfJourney as string,
        primaryPaxName: req.query.primaryPaxName as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      const bookings = await useCase.search(searchParams, req.user?.orgId!);
      res.json({
        status: 'success',
        data: bookings.map(b => b.toApiResponse(unmask))
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  // Helper to parse range query params like "2025-12-03 05:15,2025-12-03 07:50" or "3000,5000"
  private parseRangeParam(param: string | undefined): [string | undefined, string | undefined] {
    if (!param) return [undefined, undefined];
    const parts = param.split(',');
    return [parts[0]?.trim() || undefined, parts[1]?.trim() || undefined];
  }

  async filter(req: Request, res: Response) {
    try {
      const useCase = container.resolve(GetBookings);
      const unmask = shouldUnmask(req);
      
      // Parse range parameters
      const [bookingDateFrom, bookingDateTo] = this.parseRangeParam(req.query.bookingDate as string);
      const [travelStartFrom, travelStartTo] = this.parseRangeParam(req.query.travelStartAt as string);
      const [travelEndFrom, travelEndTo] = this.parseRangeParam(req.query.travelEndAt as string);
      const [dueAmountMin, dueAmountMax] = this.parseRangeParam(req.query.dueAmount as string);
      
      const filterParams = {
        status: req.query.status as string | undefined,
        paymentStatus: req.query.paymentStatus as 'paid' | 'partial' | 'unpaid' | undefined,
        bookingDateFrom: bookingDateFrom ? new Date(bookingDateFrom) : undefined,
        bookingDateTo: bookingDateTo ? new Date(bookingDateTo) : undefined,
        travelStartFrom: travelStartFrom ? new Date(travelStartFrom) : undefined,
        travelStartTo: travelStartTo ? new Date(travelStartTo) : undefined,
        travelEndFrom: travelEndFrom ? new Date(travelEndFrom) : undefined,
        travelEndTo: travelEndTo ? new Date(travelEndTo) : undefined,
        dueAmountMin: dueAmountMin ? parseFloat(dueAmountMin) : undefined,
        dueAmountMax: dueAmountMax ? parseFloat(dueAmountMax) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      const bookings = await useCase.filter(filterParams, req.user?.orgId!);
      res.json({
        status: 'success',
        data: bookings.map(b => b.toApiResponse(unmask))
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
      const useCase = container.resolve(GetBookings);
      const unmask = shouldUnmask(req);
      const booking = await useCase.getById(req.params.id, req.user?.orgId!);
      
      if (!booking) {
        return res.status(404).json({
          status: 'error',
          data: { message: 'Booking not found' }
        });
      }

      res.json({
        status: 'success',
        data: booking.toApiResponse(unmask)
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async getByCustomerId(req: Request, res: Response) {
    try {
      const useCase = container.resolve(GetBookings);
      const unmask = shouldUnmask(req);
      const bookings = await useCase.getByCustomerId(req.params.customerId, req.user?.orgId!);
      res.json({
        status: 'success',
        data: bookings.map(b => b.toApiResponse(unmask))
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
      const getBookingsUseCase = container.resolve(GetBookings);
      const useCase = container.resolve(UpdateBooking);
      const unmask = shouldUnmask(req);
      const { id } = req.params;
      
      // Capture before state for audit log
      const beforeBooking = await getBookingsUseCase.getById(id, req.user?.orgId!);
      if (beforeBooking) {
        setAuditContext(req, 'bookings', id, beforeBooking.toApiResponse(unmask));
      }
      
      const booking = await useCase.execute(id, req.body, req.user?.orgId!, req.user?.id!);
      res.json({
        status: 'success',
        data: booking.toApiResponse(unmask)
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async updatePayment(req: Request, res: Response) {
    try {
      const useCase = container.resolve(UpdateBooking);
      const { paidAmount } = req.body;
      
      if (typeof paidAmount !== 'number') {
        return res.status(400).json({
          status: 'error',
          data: { message: 'paidAmount must be a number' }
        });
      }

      const success = await useCase.updatePayment(req.params.id, paidAmount, req.user?.orgId!, req.user?.id!);
      res.json({
        status: 'success',
        data: { success }
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const getBookingsUseCase = container.resolve(GetBookings);
      const useCase = container.resolve(UpdateBooking);
      const { status } = req.body;
      const { id } = req.params;
      const unmask = shouldUnmask(req);
      
      if (!Object.values(BookingStatus).includes(status)) {
        return res.status(400).json({
          status: 'error',
          data: { message: 'Invalid status' }
        });
      }
      
      // Capture before state for audit log
      const beforeBooking = await getBookingsUseCase.getById(id, req.user?.orgId!);
      if (beforeBooking) {
        setAuditContext(req, 'bookings', id, beforeBooking.toApiResponse(unmask));
      }

      const booking = await useCase.updateStatus(id, status, req.user?.orgId!, req.user?.id!);
      res.json({
        status: 'success',
        data: booking
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async cancel(req: Request, res: Response) {
    try {
      const getBookingsUseCase = container.resolve(GetBookings);
      const useCase = container.resolve(UpdateBooking);
      const { id } = req.params;
      const unmask = shouldUnmask(req);
      
      // Capture before state for audit log
      const beforeBooking = await getBookingsUseCase.getById(id, req.user?.orgId!);
      if (beforeBooking) {
        setAuditContext(req, 'bookings', id, beforeBooking.toApiResponse(unmask));
      }
      
      const booking = await useCase.cancel(id, req.user?.orgId!, req.user?.id!);
      res.json({
        status: 'success',
        data: booking
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async confirm(req: Request, res: Response) {
    try {
      const getBookingsUseCase = container.resolve(GetBookings);
      const useCase = container.resolve(UpdateBooking);
      const { id } = req.params;
      const unmask = shouldUnmask(req);
      
      // Capture before state for audit log
      const beforeBooking = await getBookingsUseCase.getById(id, req.user?.orgId!);
      if (beforeBooking) {
        setAuditContext(req, 'bookings', id, beforeBooking.toApiResponse(unmask));
      }
      
      const booking = await useCase.confirm(id, req.user?.orgId!, req.user?.id!);
      res.json({
        status: 'success',
        data: booking
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async complete(req: Request, res: Response) {
    try {
      const getBookingsUseCase = container.resolve(GetBookings);
      const useCase = container.resolve(UpdateBooking);
      const { id } = req.params;
      const adminOverride = req.body?.adminOverride === true;
      const unmask = shouldUnmask(req);
      
      // Capture before state for audit log
      const beforeBooking = await getBookingsUseCase.getById(id, req.user?.orgId!);
      if (beforeBooking) {
        setAuditContext(req, 'bookings', id, beforeBooking.toApiResponse(unmask));
      }
      
      const booking = await useCase.complete(id, req.user?.orgId!, req.user?.id!, adminOverride);
      res.json({
        status: 'success',
        data: booking
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
      const getBookingsUseCase = container.resolve(GetBookings);
      const useCase = container.resolve(DeleteBooking);
      const { id } = req.params;
      const unmask = shouldUnmask(req);
      
      // Capture before state for audit log
      const beforeBooking = await getBookingsUseCase.getById(id, req.user?.orgId!);
      if (beforeBooking) {
        setAuditContext(req, 'bookings', id, beforeBooking.toApiResponse(unmask));
      }
      
      const success = await useCase.execute(id, req.user?.orgId!, req.user?.id!);
      res.json({
        status: 'success',
        data: { success }
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async archive(req: Request, res: Response) {
    try {
      const useCase = container.resolve(DeleteBooking);
      const success = await useCase.archive(req.params.id, req.user?.orgId!, req.user?.id!);
      res.json({
        status: 'success',
        data: { success }
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async getUpcoming(req: Request, res: Response) {
    try {
      const useCase = container.resolve(GetBookings);
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const bookings = await useCase.getUpcoming(req.user?.orgId!, days);
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

  async getByTravelDates(req: Request, res: Response) {
    try {
      const useCase = container.resolve(GetBookings);
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          status: 'error',
          data: { message: 'startDate and endDate are required' }
        });
      }

      const bookings = await useCase.getByTravelDates(
        new Date(startDate as string),
        new Date(endDate as string),
        req.user?.orgId!
      );
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

  async getOverdue(req: Request, res: Response) {
    try {
      const useCase = container.resolve(GetBookings);
      const bookings = await useCase.getOverdue(req.user?.orgId!);
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

  async getRevenueStats(req: Request, res: Response) {
    try {
      const useCase = container.resolve(GetBookings);
      const { startDate, endDate } = req.query;
      
      const stats = await useCase.getRevenueStats(
        req.user?.orgId!,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
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

  async getStats(req: Request, res: Response) {
    try {
      const useCase = container.resolve(GetBookings);
      const stats = await useCase.getStats(req.user?.orgId!);
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
