import { injectable, inject } from 'tsyringe';
import { IBookingRepository } from '../../repositories/IBookingRepository';
import { Booking } from '../../../domain/Booking';
import { BookingStatus } from '../../../models/FirestoreTypes';

interface UpdateBookingDTO {
  paxCount?: number;
  currency?: string;
  totalAmount?: number;
  paidAmount?: number;
  packageName?: string;
  primaryPaxName?: string;
  pnrNo?: string;
  modeOfJourney?: string;
  travelStartAt?: Date;
  travelEndAt?: Date;
  advanceAmount?: number;
  status?: BookingStatus;
}

@injectable()
export class UpdateBooking {
  constructor(
    @inject('IBookingRepository') private bookingRepo: IBookingRepository
  ) {}

  async execute(bookingId: string, data: UpdateBookingDTO, orgId: string, updatedBy: string): Promise<Booking> {
    // Fetch existing booking
    const booking = await this.bookingRepo.findById(bookingId, orgId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.isDeleted) {
      throw new Error('Cannot update deleted booking');
    }

    // Validate business rules
    if (data.paxCount !== undefined && data.paxCount <= 0) {
      throw new Error('Pax count must be greater than 0');
    }

    if (data.totalAmount !== undefined && data.totalAmount <= 0) {
      throw new Error('Total amount must be greater than 0');
    }

    if (data.paidAmount !== undefined) {
      const totalAmount = data.totalAmount || booking.totalAmount;
      if (data.paidAmount > totalAmount) {
        throw new Error('Paid amount cannot exceed total amount');
      }
    }

    // Update fields
    if (data.paxCount !== undefined) booking.paxCount = data.paxCount;
    if (data.currency !== undefined) booking.currency = data.currency;
    if (data.totalAmount !== undefined) booking.totalAmount = data.totalAmount;
    if (data.paidAmount !== undefined) booking.paidAmount = data.paidAmount;
    if (data.packageName !== undefined) booking.packageName = data.packageName;
    if (data.primaryPaxName !== undefined) booking.primaryPaxName = data.primaryPaxName;
    if (data.pnrNo !== undefined) booking.pnrNo = data.pnrNo;
    if (data.modeOfJourney !== undefined) booking.modeOfJourney = data.modeOfJourney;
    if (data.travelStartAt !== undefined) booking.travelStartAt = data.travelStartAt;
    if (data.travelEndAt !== undefined) booking.travelEndAt = data.travelEndAt;
    if (data.advanceAmount !== undefined) booking.advanceAmount = data.advanceAmount;
    if (data.status !== undefined) booking.status = data.status;

    booking.updatedBy = updatedBy;
    booking.updatedAt = new Date();

    // Save to repository
    return await this.bookingRepo.update(booking, orgId);
  }

  async updatePayment(bookingId: string, paidAmount: number, orgId: string, updatedBy: string): Promise<boolean> {
    // Fetch existing booking
    const booking = await this.bookingRepo.findById(bookingId, orgId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.isDeleted) {
      throw new Error('Cannot update payment for deleted booking');
    }

    if (paidAmount < 0) {
      throw new Error('Paid amount cannot be negative');
    }

    if (paidAmount > booking.totalAmount) {
      throw new Error('Paid amount cannot exceed total amount');
    }

    return await this.bookingRepo.updatePayment(bookingId, paidAmount, orgId, updatedBy);
  }

  async updateStatus(bookingId: string, status: BookingStatus, orgId: string, updatedBy: string): Promise<Booking> {
    // Fetch existing booking
    const booking = await this.bookingRepo.findById(bookingId, orgId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.isDeleted) {
      throw new Error('Cannot update status of deleted booking');
    }

    // Update status
    booking.status = status;
    booking.updatedBy = updatedBy;
    booking.updatedAt = new Date();

    return await this.bookingRepo.update(booking, orgId);
  }

  async cancel(bookingId: string, orgId: string, updatedBy: string): Promise<Booking> {
    return await this.updateStatus(bookingId, BookingStatus.CANCELLED, orgId, updatedBy);
  }

  async confirm(bookingId: string, orgId: string, updatedBy: string): Promise<Booking> {
    const booking = await this.bookingRepo.findById(bookingId, orgId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.isDeleted) {
      throw new Error('Cannot confirm deleted booking');
    }

    // Use domain method which enforces business rules
    booking.confirm(updatedBy);
    return await this.bookingRepo.update(booking, orgId);
  }

  async ticket(bookingId: string, orgId: string, updatedBy: string): Promise<Booking> {
    const booking = await this.bookingRepo.findById(bookingId, orgId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.isDeleted) {
      throw new Error('Cannot ticket deleted booking');
    }

    // Use domain method which enforces business rules
    booking.ticket(updatedBy);
    return await this.bookingRepo.update(booking, orgId);
  }

  async complete(bookingId: string, orgId: string, updatedBy: string, adminOverride: boolean = false): Promise<Booking> {
    const booking = await this.bookingRepo.findById(bookingId, orgId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.isDeleted) {
      throw new Error('Cannot complete deleted booking');
    }

    // Use domain method which enforces business rules
    booking.complete(updatedBy, adminOverride);
    return await this.bookingRepo.update(booking, orgId);
  }
}
