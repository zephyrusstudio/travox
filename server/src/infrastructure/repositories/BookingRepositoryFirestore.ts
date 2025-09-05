
import { injectable } from 'tsyringe';
import { IBookingRepository } from '../../application/repositories/IBookingRepository';
import { Booking } from '../../domain/Booking';
import { BookingStatus, PAXType } from '../../models/FirestoreTypes';
import { firestore } from '../../config/firestore';
import { Timestamp, DocumentSnapshot, DocumentData } from 'firebase-admin/firestore';
import { BookingPax } from '../../domain/BookingPax';
import { BookingItinerary } from '../../domain/BookingItinerary';
import { BookingSegment } from '../../domain/BookingSegment';

const BOOKINGS_COLLECTION = 'bookings';

@injectable()
export class BookingRepositoryFirestore implements IBookingRepository {
  private collection = firestore.collection(BOOKINGS_COLLECTION);

  async create(booking: Booking, orgId: string): Promise<Booking> {
    const docData = this.toFirestore(booking);
    const docRef = await this.collection.add(docData);
    booking.id = docRef.id;
    return booking;
  }

  async findById(id: string, orgId: string): Promise<Booking | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;

    const data = doc.data();
    if (data?.org_id !== orgId) return null;

    return this.fromFirestore(doc);
  }

  async findByCustomerId(customerId: string, orgId: string): Promise<Booking[]> {
    const snapshot = await this.collection
      .where('org_id', '==', orgId)
      .where('customer_id', '==', customerId)
      .where('is_deleted', '==', false)
      .get();

    return snapshot.docs.map(doc => this.fromFirestore(doc));
  }
  
  async findByPNR(pnr: string, orgId: string): Promise<Booking | null> {
    const snapshot = await this.collection
      .where('org_id', '==', orgId)
      .where('pnr_no', '==', pnr)
      .where('is_deleted', '==', false)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return this.fromFirestore(doc);
  }

  async findByStatus(status: BookingStatus, orgId: string): Promise<Booking[]> {
    const snapshot = await this.collection
      .where('org_id', '==', orgId)
      .where('status', '==', status)
      .where('is_deleted', '==', false)
      .get();

    return snapshot.docs.map(doc => this.fromFirestore(doc));
  }

  async findByDateRange(startDate: Date, endDate: Date, orgId: string): Promise<Booking[]> {
    const snapshot = await this.collection
      .where('org_id', '==', orgId)
      .where('booking_date', '>=', Timestamp.fromDate(startDate))
      .where('booking_date', '<=', Timestamp.fromDate(endDate))
      .where('is_deleted', '==', false)
      .get();

    return snapshot.docs.map(doc => this.fromFirestore(doc));
  }

  async findAll(orgId: string, limit?: number): Promise<Booking[]> {
    let query = this.collection
      .where('org_id', '==', orgId)
      .where('is_deleted', '==', false);
      
    if (limit) {
      query = query.limit(limit);
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => this.fromFirestore(doc));
  }

  async update(booking: Booking, orgId: string): Promise<Booking> {
    booking.updatedAt = new Date();
    const docData = this.toFirestore(booking);
    await this.collection.doc(booking.id).update(docData);
    return booking;
  }

  async updateFields(id: string, fields: Record<string, any>, orgId: string): Promise<boolean> {
    // First verify the booking exists and belongs to the org
    const doc = await this.findById(id, orgId);
    if (!doc) {
      throw new Error('Booking not found or not authorized');
    }

    const updateData = {
      ...fields,
      updated_at: Timestamp.now()
    };

    await this.collection.doc(id).update(updateData);
    return true;
  }

  async softDelete(id: string, orgId: string, updatedBy: string): Promise<boolean> {
    const doc = await this.findById(id, orgId);
    if (!doc) {
      throw new Error('Booking not found or not authorized');
    }

    await this.collection.doc(id).update({
      is_deleted: true,
      updated_by: updatedBy,
      updated_at: Timestamp.now()
    });
    return true;
  }

  async archive(id: string, orgId: string, updatedBy: string): Promise<boolean> {
    const doc = await this.findById(id, orgId);
    if (!doc) {
      throw new Error('Booking not found or not authorized');
    }

    await this.collection.doc(id).update({
      archived_at: Timestamp.now(),
      updated_by: updatedBy,
      updated_at: Timestamp.now()
    });
    return true;
  }

  async getUpcomingBookings(orgId: string, days: number = 30): Promise<Booking[]> {
    const now = Timestamp.now();
    const futureDate = Timestamp.fromMillis(now.toMillis() + (days * 24 * 60 * 60 * 1000));

    const snapshot = await this.collection
      .where('org_id', '==', orgId)
      .where('travel_start_at', '>=', now)
      .where('travel_start_at', '<=', futureDate)
      .where('is_deleted', '==', false)
      .get();

    return snapshot.docs.map(doc => this.fromFirestore(doc));
  }

  async getBookingsByTravelDates(startDate: Date, endDate: Date, orgId: string): Promise<Booking[]> {
    const snapshot = await this.collection
      .where('org_id', '==', orgId)
      .where('travel_start_at', '>=', Timestamp.fromDate(startDate))
      .where('travel_start_at', '<=', Timestamp.fromDate(endDate))
      .where('is_deleted', '==', false)
      .get();

    return snapshot.docs.map(doc => this.fromFirestore(doc));
  }

  async getRevenueStats(orgId: string, startDate?: Date, endDate?: Date): Promise<any> {
    let query = this.collection
      .where('org_id', '==', orgId)
      .where('is_deleted', '==', false)
      .where('status', '!=', BookingStatus.CANCELLED);

    if (startDate) {
      query = query.where('booking_date', '>=', Timestamp.fromDate(startDate));
    }
    if (endDate) {
      query = query.where('booking_date', '<=', Timestamp.fromDate(endDate));
    }

    const snapshot = await query.get();
    const bookings = snapshot.docs.map(doc => this.fromFirestore(doc));
    
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const paidAmount = bookings.reduce((sum, b) => sum + b.paidAmount, 0);
    
    return {
      totalRevenue,
      paidAmount,
      dueAmount: totalRevenue - paidAmount,
      bookingCount: bookings.length
    };
  }

  async updatePayment(bookingId: string, paidAmount: number, orgId: string, updatedBy: string): Promise<boolean> {
    const doc = await this.findById(bookingId, orgId);
    if (!doc) {
      throw new Error('Booking not found or not authorized');
    }

    await this.collection.doc(bookingId).update({
      paid_amount: paidAmount,
      updated_by: updatedBy,
      updated_at: Timestamp.now()
    });
    return true;
  }

  async getOverdueBookings(orgId: string): Promise<Booking[]> {
    const now = new Date();
    const snapshot = await this.collection
      .where('org_id', '==', orgId)
      .where('travel_end_at', '<', Timestamp.fromDate(now))
      .where('is_deleted', '==', false)
      .where('status', 'in', [BookingStatus.CONFIRMED, BookingStatus.TICKETED, BookingStatus.IN_PROGRESS])
      .get();

    const bookings = snapshot.docs.map(doc => this.fromFirestore(doc));
    
    return bookings.filter(booking => booking.dueAmount > 0);
  }

  // --- Mappers --- //

  private toFirestore(booking: Booking): any {
    const docData: any = {
      org_id: booking.orgId,
      customer_id: booking.customerId,
      booking_date: Timestamp.fromDate(booking.bookingDate),
      currency: booking.currency,
      total_amount: booking.totalAmount,
      paid_amount: booking.paidAmount,
      status: booking.status,
      created_by: booking.createdBy,
      updated_by: booking.updatedBy,
      is_deleted: booking.isDeleted,
      created_at: Timestamp.fromDate(booking.createdAt),
      updated_at: Timestamp.fromDate(booking.updatedAt),
      
      pax_count: booking.pax.length,
      primary_pax_name: booking.pax[0]?.paxName || null,
      travel_start_at: booking.travelStartAt ? Timestamp.fromDate(booking.travelStartAt) : null,
      travel_end_at: booking.travelEndAt ? Timestamp.fromDate(booking.travelEndAt) : null,

      package_name: booking.packageName || null,
      pnr_no: booking.pnrNo || null,
      mode_of_journey: booking.modeOfJourney || null,
      advance_amount: booking.advanceAmount || null,
      archived_at: booking.archivedAt ? Timestamp.fromDate(booking.archivedAt) : null,

      pax: booking.pax.map(p => ({
        id: p.id,
        org_id: p.orgId,
        booking_id: p.bookingId,
        pax_name: p.paxName,
        pax_type: p.paxType,
        passport_no: p.passportNo || null,
        dob: p.dob ? Timestamp.fromDate(p.dob) : null,
        created_at: Timestamp.fromDate(p.createdAt),
        updated_at: Timestamp.fromDate(p.updatedAt),
      })),

      itineraries: booking.itineraries.map(i => ({
        id: i.id,
        org_id: i.orgId,
        booking_id: i.bookingId,
        name: i.name,
        seq_no: i.seqNo,
        created_at: Timestamp.fromDate(i.createdAt),
        updated_at: Timestamp.fromDate(i.updatedAt),
        segments: i.segments.map(s => ({
          id: s.id,
          org_id: s.orgId,
          itinerary_id: s.itineraryId,
          seq_no: s.seqNo,
          mode_of_journey: s.modeOfJourney,
          carrier_code: s.carrierCode || null,
          service_number: s.serviceNumber || null,
          dep_code: s.depCode || null,
          arr_code: s.arrCode || null,
          dep_at: s.depAt ? Timestamp.fromDate(s.depAt) : null,
          arr_at: s.arrAt ? Timestamp.fromDate(s.arrAt) : null,
          class_code: s.classCode || null,
          baggage: s.baggage || null,
          hotel_name: s.hotelName || null,
          hotel_address: s.hotelAddress || null,
          check_in: s.checkIn ? Timestamp.fromDate(s.checkIn) : null,
          check_out: s.checkOut ? Timestamp.fromDate(s.checkOut) : null,
          room_type: s.roomType || null,
          meal_plan: s.mealPlan || null,
          operator_name: s.operatorName || null,
          boarding_point: s.boardingPoint || null,
          drop_point: s.dropPoint || null,
          misc: s.misc || null,
          created_at: Timestamp.fromDate(s.createdAt),
          updated_at: Timestamp.fromDate(s.updatedAt),
        }))
      }))
    };

    // Add ticket_id if it exists
    if (booking.ticketId) {
      docData.ticket_id = booking.ticketId;
    }

    return docData;
  }

  private fromFirestore(doc: DocumentSnapshot<DocumentData>): Booking {
    const data = doc.data()!;

    const booking = new Booking(
      doc.id,
      data.org_id,
      data.customer_id,
      data.booking_date.toDate(),
      data.currency,
      data.total_amount,
      (data.pax || []).map((p: any) => new BookingPax(
        p.id,
        p.org_id,
        p.booking_id,
        p.pax_name,
        p.pax_type as PAXType,
        p.passport_no,
        p.dob?.toDate(),
        p.created_at.toDate(),
        p.updated_at.toDate()
      )),
      (data.itineraries || []).map((i: any) => new BookingItinerary(
        i.id,
        i.org_id,
        i.booking_id,
        i.name,
        i.seq_no,
        (i.segments || []).map((s: any) => new BookingSegment(
          s.id,
          s.org_id,
          s.itinerary_id,
          s.seq_no,
          s.mode_of_journey,
          s.carrier_code,
          s.service_number,
          s.dep_code,
          s.arr_code,
          s.dep_at?.toDate(),
          s.arr_at?.toDate(),
          s.class_code,
          s.baggage,
          s.hotel_name,
          s.hotel_address,
          s.check_in?.toDate(),
          s.check_out?.toDate(),
          s.room_type,
          s.meal_plan,
          s.operator_name,
          s.boarding_point,
          s.drop_point,
          s.misc,
          s.created_at.toDate(),
          s.updated_at.toDate()
        )),
        i.created_at.toDate(),
        i.updated_at.toDate()
      )),
      data.paid_amount || 0,
      data.package_name,
      data.pnr_no,
      data.mode_of_journey,
      data.advance_amount,
      data.status || BookingStatus.DRAFT,
      data.created_by || '',
      data.updated_by || '',
      data.is_deleted || false,
      data.archived_at?.toDate(),
      data.created_at.toDate(),
      data.updated_at.toDate(),
      data.ticket_id
    );

    return booking;
  }
}
