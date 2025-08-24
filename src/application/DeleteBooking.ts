import { injectable, inject } from 'tsyringe';
import { IBookingRepository } from './Repositories/IBookingRepository';

@injectable()
export class DeleteBooking {
  constructor(
    @inject('IBookingRepository') private bookingRepo: IBookingRepository
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
    return await this.bookingRepo.softDelete(bookingId, orgId, deletedBy);
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
    return await this.bookingRepo.archive(bookingId, orgId, archivedBy);
  }
}
