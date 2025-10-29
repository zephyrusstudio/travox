import { injectable, inject } from 'tsyringe';
import { IBookingRepository } from '../../repositories/IBookingRepository';
import { Booking } from '../../../domain/Booking';
import { BookingStatus, ModeOfJourney, PAXType } from '../../../models/FirestoreTypes';
import { BookingPax } from '../../../domain/BookingPax';
import { BookingItinerary } from '../../../domain/BookingItinerary';
import { BookingSegment } from '../../../domain/BookingSegment';

// Re-using DTOs from CreateBooking for consistency
interface PaxDTO {
  paxName: string;
  paxType: PAXType;
  passportNo?: string;
  dob?: Date;
}

interface SegmentDTO {
  seqNo: number;
  modeOfJourney: ModeOfJourney;
  carrierCode?: string;
  serviceNumber?: string;
  depCode?: string;
  arrCode?: string;
  depAt?: Date;
  arrAt?: Date;
  classCode?: string;
  baggage?: string;
  hotelName?: string;
  hotelAddress?: string;
  checkIn?: Date;
  checkOut?: Date;
  roomType?: string;
  mealPlan?: string;
  operatorName?: string;
  boardingPoint?: string;
  dropPoint?: string;
  misc?: Record<string, any>;
}

interface ItineraryDTO {
  name: string;
  seqNo: number;
  segments: SegmentDTO[];
}

interface UpdateBookingDTO {
  customerId?: string;
  currency?: string;
  totalAmount?: number;
  bookingDate?: Date;
  pax?: PaxDTO[];
  itineraries?: ItineraryDTO[];
  packageName?: string;
  pnrNo?: string;
  modeOfJourney?: string;
  advanceAmount?: number;
  status?: BookingStatus;
  vendorId?: string;
}

@injectable()
export class UpdateBooking {
  constructor(
    @inject('IBookingRepository') private bookingRepo: IBookingRepository
  ) {}

  async execute(bookingId: string, data: UpdateBookingDTO, orgId: string, updatedBy: string): Promise<Booking> {
    const booking = await this.bookingRepo.findById(bookingId, orgId);
    if (!booking) {
      throw new Error('Booking not found');
    }
    if (booking.isDeleted) {
      throw new Error('Cannot update a deleted booking');
    }

    // Update top-level properties
    booking.customerId = data.customerId || booking.customerId;
    booking.currency = data.currency || booking.currency;
    booking.packageName = data.packageName || booking.packageName;
    booking.pnrNo = data.pnrNo || booking.pnrNo;
    booking.modeOfJourney = data.modeOfJourney || booking.modeOfJourney;
    booking.advanceAmount = data.advanceAmount || booking.advanceAmount;
    
    // Update bookingDate if provided
    if (data.bookingDate !== undefined) {
      booking.bookingDate = data.bookingDate;
    }
    
    // Update vendorId if provided (Note: this doesn't automatically manage vendor booking counts)
    if (data.vendorId !== undefined) {
      booking.vendorId = data.vendorId;
    }

    if (data.totalAmount !== undefined) {
      booking.updateAmount(data.totalAmount, updatedBy);
    }

    // Replace Pax and Itineraries if provided
    if (data.pax) {
      booking.pax = data.pax.map(p => BookingPax.create(orgId, booking.id, p.paxName, p.paxType, p));
    }
    if (data.itineraries) {
      booking.itineraries = data.itineraries.map(i => {
        const itinerary = BookingItinerary.create(orgId, booking.id, i.name, i.seqNo);
        itinerary.segments = i.segments.map(s => BookingSegment.create(orgId, itinerary.id, s.seqNo, s.modeOfJourney, s));
        return itinerary;
      });
    }

    // Recalculate denormalized fields after updates
    booking.recalculatePaxFields();
    booking.recalculateTravelDates();

    // Update status last, as it might have dependencies on other fields
    if (data.status) {
      booking.updateStatus(data.status, updatedBy);
    }

    booking.updatedBy = updatedBy;
    booking.updatedAt = new Date();

    return await this.bookingRepo.update(booking, orgId);
  }

  async updatePayment(bookingId: string, paidAmount: number, orgId: string, updatedBy: string): Promise<boolean> {
    const booking = await this.bookingRepo.findById(bookingId, orgId);
    if (!booking) {
      throw new Error('Booking not found');
    }
    if (paidAmount > booking.totalAmount) {
      throw new Error('Paid amount cannot exceed total amount');
    }
    // This directly updates the field in the DB, bypassing the domain object for this specific case.
    return await this.bookingRepo.updatePayment(bookingId, paidAmount, orgId, updatedBy);
  }

  async updateStatus(bookingId: string, status: BookingStatus, orgId: string, updatedBy: string): Promise<Booking> {
    const booking = await this.bookingRepo.findById(bookingId, orgId);
    if (!booking) {
      throw new Error('Booking not found');
    }
    booking.updateStatus(status, updatedBy);
    return await this.bookingRepo.update(booking, orgId);
  }

  async cancel(bookingId: string, orgId: string, updatedBy: string): Promise<Booking> {
    return this.updateStatus(bookingId, BookingStatus.CANCELLED, orgId, updatedBy);
  }

  async confirm(bookingId: string, orgId: string, updatedBy: string): Promise<Booking> {
    const booking = await this.bookingRepo.findById(bookingId, orgId);
    if (!booking) {
      throw new Error('Booking not found');
    }
    booking.confirm(updatedBy);
    return await this.bookingRepo.update(booking, orgId);
  }

  async ticket(bookingId: string, orgId: string, updatedBy: string): Promise<Booking> {
    const booking = await this.bookingRepo.findById(bookingId, orgId);
    if (!booking) {
      throw new Error('Booking not found');
    }
    booking.ticket(updatedBy);
    return await this.bookingRepo.update(booking, orgId);
  }

  async complete(bookingId: string, orgId: string, updatedBy: string, adminOverride: boolean = false): Promise<Booking> {
    const booking = await this.bookingRepo.findById(bookingId, orgId);
    if (!booking) {
      throw new Error('Booking not found');
    }
    booking.complete(updatedBy, adminOverride);
    return await this.bookingRepo.update(booking, orgId);
  }
}