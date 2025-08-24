import { Request, Response } from 'express';
import { container } from '../../config/container';
import { CreateBooking } from '../../application/CreateBooking';
import { GetBookings } from '../../application/GetBookings';
import { UpdateBooking } from '../../application/UpdateBooking';
import { DeleteBooking } from '../../application/DeleteBooking';
import { BookingStatus } from '../../models/FirestoreTypes';

export class BookingController {
  async create(req: Request, res: Response) {
    try {
      const useCase = container.resolve(CreateBooking);
      const booking = await useCase.execute(req.body, req.user?.orgId!, req.user?.id!);
      res.status(201).json(booking);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const useCase = container.resolve(GetBookings);
      
      const filters = {
        customerId: req.query.customerId as string,
        status: req.query.status as BookingStatus,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        pnr: req.query.pnr as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
      };

      const bookings = await useCase.execute(filters, req.user?.orgId!);
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const useCase = container.resolve(GetBookings);
      const booking = await useCase.getById(req.params.id, req.user?.orgId!);
      
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      res.json(booking);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const useCase = container.resolve(UpdateBooking);
      const booking = await useCase.execute(req.params.id, req.body, req.user?.orgId!, req.user?.id!);
      res.json(booking);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async updatePayment(req: Request, res: Response) {
    try {
      const useCase = container.resolve(UpdateBooking);
      const { paidAmount } = req.body;
      
      if (typeof paidAmount !== 'number') {
        return res.status(400).json({ message: 'paidAmount must be a number' });
      }

      const success = await useCase.updatePayment(req.params.id, paidAmount, req.user?.orgId!, req.user?.id!);
      res.json({ success });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const useCase = container.resolve(UpdateBooking);
      const { status } = req.body;
      
      if (!Object.values(BookingStatus).includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      const booking = await useCase.updateStatus(req.params.id, status, req.user?.orgId!, req.user?.id!);
      res.json(booking);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async cancel(req: Request, res: Response) {
    try {
      const useCase = container.resolve(UpdateBooking);
      const booking = await useCase.cancel(req.params.id, req.user?.orgId!, req.user?.id!);
      res.json(booking);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async confirm(req: Request, res: Response) {
    try {
      const useCase = container.resolve(UpdateBooking);
      const booking = await useCase.confirm(req.params.id, req.user?.orgId!, req.user?.id!);
      res.json(booking);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async complete(req: Request, res: Response) {
    try {
      const useCase = container.resolve(UpdateBooking);
      const booking = await useCase.complete(req.params.id, req.user?.orgId!, req.user?.id!);
      res.json(booking);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const useCase = container.resolve(DeleteBooking);
      const success = await useCase.execute(req.params.id, req.user?.orgId!, req.user?.id!);
      res.json({ success });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async archive(req: Request, res: Response) {
    try {
      const useCase = container.resolve(DeleteBooking);
      const success = await useCase.archive(req.params.id, req.user?.orgId!, req.user?.id!);
      res.json({ success });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getUpcoming(req: Request, res: Response) {
    try {
      const useCase = container.resolve(GetBookings);
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const bookings = await useCase.getUpcoming(req.user?.orgId!, days);
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getByTravelDates(req: Request, res: Response) {
    try {
      const useCase = container.resolve(GetBookings);
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'startDate and endDate are required' });
      }

      const bookings = await useCase.getByTravelDates(
        new Date(startDate as string),
        new Date(endDate as string),
        req.user?.orgId!
      );
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getOverdue(req: Request, res: Response) {
    try {
      const useCase = container.resolve(GetBookings);
      const bookings = await useCase.getOverdue(req.user?.orgId!);
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
