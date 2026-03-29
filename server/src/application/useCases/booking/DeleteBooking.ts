import { injectable, inject } from 'tsyringe';
import { IBookingRepository } from '../../repositories/IBookingRepository';
import { ICustomerRepository } from '../../repositories/ICustomerRepository';
import { getCurrentISTDate } from '../../../utils/timezone';
import { RedisService } from '../../../infrastructure/services/RedisService';

@injectable()
export class DeleteBooking {
  constructor(
    @inject('IBookingRepository') private bookingRepo: IBookingRepository,
    @inject('ICustomerRepository') private customerRepo: ICustomerRepository,
    @inject('RedisService') private cache: RedisService
  ) {}

  async execute(bookingId: string, orgId: string, deletedBy: string): Promise<boolean> {
    // Fetch existing booking
    const booking = await this.bookingRepo.findById(bookingId, orgId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.isDeleted) {
      throw new Error('Booking is already deleted');
    }

    // Perform soft delete
    const result = await this.bookingRepo.softDelete(bookingId, orgId, deletedBy);
    if (result) {
      // Decrement customer's totalBookings
      const customer = await this.customerRepo.findById(booking.customerId, orgId);
      if (customer && customer.totalBookings > 0) {
        customer.totalBookings -= 1;
        customer.updatedAt = getCurrentISTDate();
        await this.customerRepo.update(customer, orgId);
      }
      await this.invalidateReportCaches(orgId);
    }
    return result;
  }

  async archive(bookingId: string, orgId: string, archivedBy: string): Promise<boolean> {
    // Fetch existing booking
    const booking = await this.bookingRepo.findById(bookingId, orgId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.isDeleted) {
      throw new Error('Cannot archive deleted booking');
    }

    if (booking.archivedAt) {
      throw new Error('Booking is already archived');
    }

    // Archive the booking
    const archived = await this.bookingRepo.archive(bookingId, orgId, archivedBy);
    if (archived) {
      await this.invalidateReportCaches(orgId);
    }
    return archived;
  }

  private async invalidateReportCaches(orgId: string): Promise<void> {
    await this.cache.invalidatePattern(`report:customers:bookings:${orgId}:*`);
    await this.cache.invalidatePattern(`report:center:${orgId}:*`);
  }
}
