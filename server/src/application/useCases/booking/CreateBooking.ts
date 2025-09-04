import { injectable, inject } from 'tsyringe';
import { IBookingRepository } from '../../repositories/IBookingRepository';
import { ICustomerRepository } from '../../repositories/ICustomerRepository';
import { Booking } from '../../../domain/Booking';
import { BookingStatus, ModeOfJourney, PAXType } from '../../../models/FirestoreTypes';
import { BookingPax } from '../../../domain/BookingPax';
import { BookingItinerary } from '../../../domain/BookingItinerary';
import { BookingSegment } from '../../../domain/BookingSegment';

// DTOs for creation from raw request data
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

interface CreateBookingDTO {
  customerId: string;
  currency: string;
  totalAmount: number;
  pax: PaxDTO[];
  itineraries?: ItineraryDTO[];
  bookingDate?: Date;
  paidAmount?: number;
  packageName?: string;
  pnrNo?: string;
  modeOfJourney?: string;
  advanceAmount?: number;
  status?: BookingStatus;
}

@injectable()
export class CreateBooking {
  constructor(
    @inject('IBookingRepository') private bookingRepo: IBookingRepository,
    @inject('ICustomerRepository') private customerRepo: ICustomerRepository
  ) {}

  async execute(data: CreateBookingDTO, orgId: string, createdBy: string): Promise<Booking> {
    // --- Validation ---
    if (!data.customerId || !data.currency || !data.totalAmount || !data.pax || data.pax.length === 0) {
      throw new Error('Missing required fields: customerId, currency, totalAmount, and at least one pax');
    }
    if (data.totalAmount <= 0) {
      throw new Error('Total amount must be greater than 0');
    }

    let paidAmount = 0;
    if (data.advanceAmount !== undefined && typeof data.advanceAmount === 'number') {
      paidAmount = data.advanceAmount;
    }

    if (paidAmount > data.totalAmount) {
      throw new Error('Paid amount cannot exceed total amount');
    }

    // --- Domain Object Creation ---
    const tempBookingId = 'temp-id'; // Will be replaced by the real one in Booking.create

    const pax = data.pax.map(p => BookingPax.create(orgId, tempBookingId, p.paxName, p.paxType, { dob: p.dob, passportNo: p.passportNo }));
    
    const itineraries = (data.itineraries || []).map(i => {
      const tempItineraryId = 'temp-itinerary-id'; // Will be replaced
      const segments = i.segments.map(s => BookingSegment.create(orgId, tempItineraryId, s.seqNo, s.modeOfJourney, s));
      return BookingItinerary.create(orgId, tempBookingId, i.name, i.seqNo, segments);
    });

    const booking = Booking.create(
      orgId,
      data.customerId,
      data.totalAmount,
      data.currency,
      createdBy,
      {
        pax,
        itineraries,
        packageName: data.packageName,
        pnrNo: data.pnrNo,
        modeOfJourney: data.modeOfJourney,
        advanceAmount: data.advanceAmount,
        status: data.status,
        bookingDate: data.bookingDate
      }
    );

    if (paidAmount > 0) {
      booking.addPayment(paidAmount, createdBy);
    }

    // Persist booking
    const createdBooking = await this.bookingRepo.create(booking, orgId);

    // Update customer's totalBookings
    const customer = await this.customerRepo.findById(data.customerId, orgId);
    if (customer) {
      customer.incrementBookingCount();
      await this.customerRepo.update(customer, orgId);
    }

    return createdBooking;
  }
}