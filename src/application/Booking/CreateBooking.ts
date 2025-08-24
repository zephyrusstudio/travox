import { injectable, inject } from 'tsyringe';
import { IBookingRepository } from '../Repositories/IBookingRepository';
import { Booking } from '../../domain/Booking';
import { BookingStatus } from '../../models/FirestoreTypes';

interface CreateBookingDTO {
  customerId: string;
  bookingDate?: Date;
  paxCount: number;
  currency: string;
  totalAmount: number;
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
export class CreateBooking {
  constructor(
    @inject('IBookingRepository') private bookingRepo: IBookingRepository
  ) {}

  async execute(data: CreateBookingDTO, orgId: string, createdBy: string): Promise<Booking> {
    // Validate required fields
    if (!data.customerId || !data.paxCount || !data.currency || !data.totalAmount) {
      throw new Error('Missing required fields: customerId, paxCount, currency, totalAmount');
    }

    if (data.paxCount <= 0) {
      throw new Error('Pax count must be greater than 0');
    }

    if (data.totalAmount <= 0) {
      throw new Error('Total amount must be greater than 0');
    }

    if (data.paidAmount && data.paidAmount > data.totalAmount) {
      throw new Error('Paid amount cannot exceed total amount');
    }

    // Create booking domain object
    const booking = Booking.create(
      orgId,
      data.customerId,
      data.paxCount,
      data.totalAmount,
      data.currency,
      createdBy,
      {
        packageName: data.packageName,
        primaryPaxName: data.primaryPaxName,
        pnrNo: data.pnrNo,
        modeOfJourney: data.modeOfJourney,
        travelStartAt: data.travelStartAt,
        travelEndAt: data.travelEndAt,
        advanceAmount: data.advanceAmount
      }
    );

    // Set additional fields after creation
    if (data.bookingDate) {
      booking.bookingDate = data.bookingDate;
    }
    if (data.paidAmount) {
      booking.paidAmount = data.paidAmount;
    }
    if (data.status) {
      booking.status = data.status;
    }

    // Save to repository
    return await this.bookingRepo.create(booking, orgId);
  }
}
