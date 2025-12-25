
import { BookingStatus } from '../models/FirestoreTypes';
import { BookingItinerary } from './BookingItinerary';
import { BookingPax } from './BookingPax';
import { v4 as uuidv4 } from 'uuid';

export class Booking {
  // Denormalized fields for quick access, derived from arrays
  public paxCount: number;
  public primaryPaxName?: string;
  public travelStartAt?: Date;
  public travelEndAt?: Date;

  constructor(
    public id: string,
    public orgId: string,
    public customerId: string,
    public bookingDate: Date,
    public currency: string,
    public totalAmount: number,
    public pax: BookingPax[] = [],
    public itineraries: BookingItinerary[] = [],
    public paidAmount: number = 0,
    public dueAmount: number = totalAmount,
    public packageName?: string,
    public pnrNo?: string,
    public modeOfJourney?: string,
    public advanceAmount?: number,
    public status: BookingStatus = BookingStatus.DRAFT,
    public vendorId?: string,
    public createdBy: string = '',
    public updatedBy: string = '',
    public isDeleted: boolean = false,
    public archivedAt?: Date,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public ticketId?: string
  ) {
    this.paxCount = this.pax.length;
    this.primaryPaxName = this.pax[0]?.paxName;
    this.recalculateTravelDates();
  }

  static create(
    orgId: string,
    customerId: string,
    totalAmount: number,
    currency: string,
    createdBy: string,
    options?: {
      pax?: BookingPax[];
      itineraries?: BookingItinerary[];
      packageName?: string;
      pnrNo?: string;
      modeOfJourney?: string;
      advanceAmount?: number;
      status?: BookingStatus;
      bookingDate?: Date;
      vendorId?: string;
    }
  ): Booking {
    const now = new Date();
    const bookingId = uuidv4();

    const booking = new Booking(
      bookingId,
      orgId,
      customerId,
      options?.bookingDate || now,
      currency,
      totalAmount,
      options?.pax || [],
      options?.itineraries || [],
      0,
      totalAmount,
      options?.packageName,
      options?.pnrNo,
      options?.modeOfJourney,
      options?.advanceAmount,
      options?.status || BookingStatus.DRAFT,
      options?.vendorId,
      createdBy,
      createdBy,
      false,
      undefined,
      now,
      now
    );

    // Ensure child objects have the correct bookingId
    booking.pax.forEach(p => p.bookingId = bookingId);
    booking.itineraries.forEach(i => {
      i.bookingId = bookingId;
      // Ensure all segments within each itinerary have the correct itinerary ID
      i.segments.forEach(s => s.itineraryId = i.id);
    });
    
    return booking;
  }

  // --- Property Getters ---

  get isPaid(): boolean {
    return this.dueAmount <= 0;
  }

  // --- Public Methods ---

  addPayment(amount: number, updatedBy: string = ''): void {
    this.paidAmount += amount;
    this.dueAmount -= amount;
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
  }

  deductPayment(amount: number, updatedBy: string = ''): void {
    this.paidAmount = Math.max(0, this.paidAmount - amount);
    // dueAmount is NOT updated here because this is typically used for refunds
    // where we return money but don't expect the customer to pay it back.
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
    
    // Set status to Refunded if paid amount reaches zero
    if (this.paidAmount === 0 && this.status !== BookingStatus.REFUNDED) {
      this.status = BookingStatus.REFUNDED;
    }
  }

  updateStatus(status: BookingStatus, updatedBy: string = ''): void {
    this.status = status;
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
  }

  updateAmount(totalAmount: number, updatedBy: string = ''): void {
    const diff = totalAmount - this.totalAmount;
    this.totalAmount = totalAmount;
    this.dueAmount = Math.max(0, this.dueAmount + diff);
    
    // If new total amount is less than paid amount, this creates an overpayment scenario
    // In this case, dueAmount stays at 0 (no further payment needed)
    if (totalAmount < this.paidAmount) {
      this.dueAmount = 0;
    }
    
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
  }

  addPax(pax: BookingPax, updatedBy: string = ''): void {
    // Ensure the pax has the correct booking ID
    pax.bookingId = this.id;
    
    this.pax.push(pax);
    this.recalculatePaxFields();
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
  }

  addItinerary(itinerary: BookingItinerary, updatedBy: string = ''): void {
    // Ensure the itinerary has the correct booking ID
    itinerary.bookingId = this.id;
    // Ensure all segments have the correct itinerary ID
    itinerary.segments.forEach(segment => {
      segment.itineraryId = itinerary.id;
    });
    
    this.itineraries.push(itinerary);
    this.recalculateTravelDates();
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
  }

  // --- Business Logic Methods ---

  confirm(updatedBy: string = ''): void {
    if (this.pax.length < 1) {
      throw new Error('Cannot confirm booking: at least 1 PAX is required');
    }
    this.updateStatus(BookingStatus.CONFIRMED, updatedBy);
  }

  ticket(updatedBy: string = ''): void {
    const hasSegments = this.itineraries.some(i => i.segments.length > 0);
    if (!hasSegments) {
      throw new Error('Cannot ticket booking: at least one travel segment is required');
    }
    this.updateStatus(BookingStatus.TICKETED, updatedBy);
  }

  complete(updatedBy: string = '', adminOverride: boolean = false): void {
    const now = new Date();
    
    if (!adminOverride) {
      if (this.travelEndAt && this.travelEndAt >= now) {
        throw new Error('Cannot complete booking: travel has not ended yet');
      }
      if (this.dueAmount > 0) {
        throw new Error('Cannot complete booking: outstanding due amount must be 0');
      }
    }
    this.updateStatus(BookingStatus.COMPLETED, updatedBy);
  }

  cancel(updatedBy: string = ''): void {
    this.updateStatus(BookingStatus.CANCELLED, updatedBy);
  }

  archive(updatedBy: string = ''): void {
    this.archivedAt = new Date();
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
  }

  softDelete(updatedBy: string = ''): void {
    this.isDeleted = true;
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
  }

  // --- Private Helper Methods ---

  public recalculatePaxFields(): void {
    this.paxCount = this.pax.length;
    this.primaryPaxName = this.pax[0]?.paxName;
  }

  public recalculateTravelDates(): void {
    const allSegments = this.itineraries.flatMap(i => i.segments);
    if (allSegments.length === 0) {
      this.travelStartAt = undefined;
      this.travelEndAt = undefined;
      return;
    }

    // Collect all valid departure dates (depAt for most modes, checkIn for hotels)
    const departureDates = allSegments
      .map(s => {
        if (s.modeOfJourney === 'HOTEL') {
          return s.checkIn;
        }
        return s.depAt;
      })
      .filter((d): d is Date => d !== undefined && d instanceof Date);
      
    // Collect all valid arrival dates (arrAt for most modes, checkOut for hotels)
    // This handles your main concern - arrAt can be undefined and won't cause issues
    const arrivalDates = allSegments
      .map(s => {
        if (s.modeOfJourney === 'HOTEL') {
          return s.checkOut;
        }
        return s.arrAt;
      })
      .filter((d): d is Date => d !== undefined && d instanceof Date);

    // Calculate travel dates only if we have valid dates
    this.travelStartAt = departureDates.length > 0 
      ? new Date(Math.min(...departureDates.map(d => d.getTime()))) 
      : undefined;
      
    this.travelEndAt = arrivalDates.length > 0 
      ? new Date(Math.max(...arrivalDates.map(d => d.getTime()))) 
      : undefined;
  }

  // Get booking data for API response with optional unmasking of sensitive fields
  toApiResponse(unmask: boolean = false): any {
    return {
      id: this.id,
      orgId: this.orgId,
      customerId: this.customerId,
      bookingDate: this.bookingDate,
      currency: this.currency,
      totalAmount: this.totalAmount,
      paidAmount: this.paidAmount,
      pax: this.pax.map(p => p.toApiResponse(unmask)),
      itineraries: this.itineraries.map(i => i.toApiResponse()),
      packageName: this.packageName || null,
      pnrNo: this.pnrNo || null,
      modeOfJourney: this.modeOfJourney || null,
      advanceAmount: this.advanceAmount || null,
      status: this.status,
      paxCount: this.paxCount,
      primaryPaxName: this.primaryPaxName || null,
      travelStartAt: this.travelStartAt || null,
      travelEndAt: this.travelEndAt || null,
      dueAmount: this.dueAmount,
      vendorId: this.vendorId || null,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      isDeleted: this.isDeleted,
      archivedAt: this.archivedAt || null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      ticketId: this.ticketId || null
    };
  }
}

