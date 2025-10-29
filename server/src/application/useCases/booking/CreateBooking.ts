import { injectable, inject } from 'tsyringe';
import { IBookingRepository } from '../../repositories/IBookingRepository';
import { ICustomerRepository } from '../../repositories/ICustomerRepository';
import { IVendorRepository } from '../../repositories/IVendorRepository';
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
  packageName?: string;
  pnrNo?: string;
  modeOfJourney?: string;
  advanceAmount?: number;
  status?: BookingStatus;
  vendorId?: string;
}

@injectable()
export class CreateBooking {
  constructor(
    @inject('IBookingRepository') private bookingRepo: IBookingRepository,
    @inject('ICustomerRepository') private customerRepo: ICustomerRepository,
    @inject('IVendorRepository') private vendorRepo: IVendorRepository
  ) {}

  async execute(data: CreateBookingDTO, orgId: string, createdBy: string): Promise<Booking> {
    // --- Minimal Required Field Validation ---
    if (!data.customerId || !data.currency || data.totalAmount === undefined || data.totalAmount === null || !data.pax || data.pax.length === 0) {
      throw new Error('Missing required fields: customerId, currency, totalAmount, and at least one pax');
    }
    
    if (data.totalAmount <= 0) {
      throw new Error('Total amount must be greater than 0');
    }

    // Validate PAX - only name and type are required
    for (const pax of data.pax) {
      if (!pax.paxName || !pax.paxType) {
        throw new Error('Each passenger must have paxName and paxType');
      }
    }

    // Validate segments if provided - mode-specific validation
    if (data.itineraries) {
      for (const itinerary of data.itineraries) {
        if (!itinerary.name || itinerary.seqNo === undefined) {
          throw new Error('Each itinerary must have name and seqNo');
        }
        
        for (const segment of itinerary.segments) {
          if (!segment.modeOfJourney || segment.seqNo === undefined) {
            throw new Error('Each segment must have modeOfJourney and seqNo');
          }
          
          // Mode-specific validation (minimal requirements only)
          this.validateSegmentByMode(segment);
        }
      }
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
      // Create segments first with temporary itinerary ID
      const segments = i.segments.map(s => BookingSegment.create(orgId, 'temp-itinerary-id', s.seqNo, s.modeOfJourney, s));
      // Create itinerary which will update segment itinerary IDs to the real itinerary ID
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
        bookingDate: data.bookingDate,
        vendorId: data.vendorId
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

    // Update vendor's totalBookings if vendorId is provided
    if (data.vendorId) {
      const vendor = await this.vendorRepo.findById(data.vendorId, orgId);
      if (vendor) {
        vendor.incrementBookingCount();
        await this.vendorRepo.update(vendor, orgId);
      }
    }

    return createdBooking;
  }

  /**
   * Mode-specific minimal validation for booking segments
   * Only validates truly essential fields per mode of journey
   */
  private validateSegmentByMode(segment: SegmentDTO): void {
    switch (segment.modeOfJourney) {
      case ModeOfJourney.FLIGHT:
        // For flights, only departure location is truly essential
        // arrAt and depAt are both optional as per your requirement
        if (!segment.depCode) {
          throw new Error('Departure code (depCode) is required for flight segments');
        }
        break;
        
      case ModeOfJourney.HOTEL:
        // For hotels, hotel name is essential
        if (!segment.hotelName) {
          throw new Error('Hotel name is required for hotel segments');
        }
        break;
        
      case ModeOfJourney.TRAIN:
      case ModeOfJourney.BUS:
        // For ground transport, at least departure point should be known
        if (!segment.depCode && !segment.boardingPoint) {
          throw new Error('Either departure code or boarding point is required for ground transport segments');
        }
        break;
        
      case ModeOfJourney.CAB:
        // For cabs, boarding and drop points are useful but not strictly required for minimal booking
        break;
        
      case ModeOfJourney.OTHER:
        // For other modes, no specific validation - maximum flexibility
        break;
        
      default:
        throw new Error(`Unsupported mode of journey: ${segment.modeOfJourney}`);
    }
  }
}