import { injectable } from 'tsyringe';
import { IBookingRepository } from '../../application/Repositories/IBookingRepository';
import { Booking } from '../../domain/Booking';
import { BookingStatus } from '../../models/FirestoreTypes';
import { firestore } from '../../config/firestore';
import { Timestamp } from 'firebase-admin/firestore';

const BOOKINGS_COLLECTION = 'bookings';

@injectable()
export class BookingRepositoryFirestore implements IBookingRepository {
  private collection = firestore.collection(BOOKINGS_COLLECTION);

  async create(booking: Booking, orgId: string): Promise<Booking> {
    const now = Timestamp.now();
    const docData: any = {
      org_id: orgId,
      customer_id: booking.customerId,
      booking_date: Timestamp.fromDate(booking.bookingDate),
      pax_count: booking.paxCount,
      currency: booking.currency,
      total_amount: booking.totalAmount,
      paid_amount: booking.paidAmount,
      travel_start_at: booking.travelStartAt ? Timestamp.fromDate(booking.travelStartAt) : null,
      travel_end_at: booking.travelEndAt ? Timestamp.fromDate(booking.travelEndAt) : null,
      status: booking.status,
      created_by: booking.createdBy,
      updated_by: booking.updatedBy,
      is_deleted: booking.isDeleted,
      archived_at: booking.archivedAt ? Timestamp.fromDate(booking.archivedAt) : null,
      created_at: now,
      updated_at: now,
    };

    // Only add optional fields if they are not undefined
    if (booking.packageName !== undefined) docData.package_name = booking.packageName;
    if (booking.primaryPaxName !== undefined) docData.primary_pax_name = booking.primaryPaxName;
    if (booking.pnrNo !== undefined) docData.pnr_no = booking.pnrNo;
    if (booking.modeOfJourney !== undefined) docData.mode_of_journey = booking.modeOfJourney;
    if (booking.advanceAmount !== undefined) docData.advance_amount = booking.advanceAmount;

    const docRef = await this.collection.add(docData);
    booking.id = docRef.id;
    return booking;
  }

  async findById(id: string, orgId: string): Promise<Booking | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;

    const data = doc.data() as any;
    if (data.org_id !== orgId) return null;

    return this.documentToDomain(data, doc.id);
  }

  async findByCustomerId(customerId: string, orgId: string): Promise<Booking[]> {
    const snapshot = await this.collection
      .where('org_id', '==', orgId)
      .where('customer_id', '==', customerId)
      .where('is_deleted', '==', false)
      .get();

    return snapshot.docs.map(doc => this.documentToDomain(doc.data(), doc.id));
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
    return this.documentToDomain(doc.data(), doc.id);
  }

  async findByStatus(status: BookingStatus, orgId: string): Promise<Booking[]> {
    const snapshot = await this.collection
      .where('org_id', '==', orgId)
      .where('status', '==', status)
      .where('is_deleted', '==', false)
      .get();

    return snapshot.docs.map(doc => this.documentToDomain(doc.data(), doc.id));
  }

  async findByDateRange(startDate: Date, endDate: Date, orgId: string): Promise<Booking[]> {
    const snapshot = await this.collection
      .where('org_id', '==', orgId)
      .where('booking_date', '>=', Timestamp.fromDate(startDate))
      .where('booking_date', '<=', Timestamp.fromDate(endDate))
      .where('is_deleted', '==', false)
      .get();

    return snapshot.docs.map(doc => this.documentToDomain(doc.data(), doc.id));
  }

  async findAll(orgId: string, limit?: number): Promise<Booking[]> {
    let query = this.collection
      .where('org_id', '==', orgId)
      .where('is_deleted', '==', false);
      
    if (limit) {
      query = query.limit(limit);
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => this.documentToDomain(doc.data(), doc.id));
  }

  async update(booking: Booking, orgId: string): Promise<Booking> {
    booking.updatedAt = new Date();
    const updateData: any = {
      customer_id: booking.customerId,
      booking_date: Timestamp.fromDate(booking.bookingDate),
      pax_count: booking.paxCount,
      currency: booking.currency,
      total_amount: booking.totalAmount,
      paid_amount: booking.paidAmount,
      travel_start_at: booking.travelStartAt ? Timestamp.fromDate(booking.travelStartAt) : null,
      travel_end_at: booking.travelEndAt ? Timestamp.fromDate(booking.travelEndAt) : null,
      status: booking.status,
      updated_by: booking.updatedBy,
      updated_at: Timestamp.now()
    };

    // Only add optional fields if they are not undefined
    if (booking.packageName !== undefined) updateData.package_name = booking.packageName;
    if (booking.primaryPaxName !== undefined) updateData.primary_pax_name = booking.primaryPaxName;
    if (booking.pnrNo !== undefined) updateData.pnr_no = booking.pnrNo;
    if (booking.modeOfJourney !== undefined) updateData.mode_of_journey = booking.modeOfJourney;
    if (booking.advanceAmount !== undefined) updateData.advance_amount = booking.advanceAmount;

    await this.collection.doc(booking.id).update(updateData);
    return booking;
  }

  async softDelete(id: string, orgId: string, updatedBy: string): Promise<boolean> {
    await this.collection.doc(id).update({
      is_deleted: true,
      updated_by: updatedBy,
      updated_at: Timestamp.now()
    });
    return true;
  }

  async archive(id: string, orgId: string, updatedBy: string): Promise<boolean> {
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

    return snapshot.docs.map(doc => this.documentToDomain(doc.data(), doc.id));
  }

  async getBookingsByTravelDates(startDate: Date, endDate: Date, orgId: string): Promise<Booking[]> {
    const snapshot = await this.collection
      .where('org_id', '==', orgId)
      .where('travel_start_at', '>=', Timestamp.fromDate(startDate))
      .where('travel_start_at', '<=', Timestamp.fromDate(endDate))
      .where('is_deleted', '==', false)
      .get();

    return snapshot.docs.map(doc => this.documentToDomain(doc.data(), doc.id));
  }

  async getRevenueStats(orgId: string, startDate?: Date, endDate?: Date): Promise<{
    totalRevenue: number;
    paidAmount: number;
    dueAmount: number;
    bookingCount: number;
  }> {
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
    const bookings = snapshot.docs.map(doc => this.documentToDomain(doc.data(), doc.id));
    
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
    await this.collection.doc(bookingId).update({
      paid_amount: paidAmount,
      updated_by: updatedBy,
      updated_at: Timestamp.now()
    });
    return true;
  }

  async getOverdueBookings(orgId: string): Promise<Booking[]> {
    const now = Timestamp.now();
    
    const snapshot = await this.collection
      .where('org_id', '==', orgId)
      .where('travel_start_at', '<', now)
      .where('is_deleted', '==', false)
      .get();

    const bookings = snapshot.docs.map(doc => this.documentToDomain(doc.data(), doc.id));
    
    // Filter for bookings with due amount
    return bookings.filter(booking => booking.totalAmount > booking.paidAmount);
  }

  private documentToDomain(data: any, id: string): Booking {
    return new Booking(
      id,
      data.org_id,
      data.customer_id,
      data.booking_date.toDate(),
      data.pax_count,
      data.currency,
      data.total_amount,
      data.paid_amount || 0,
      data.package_name,
      data.primary_pax_name,
      data.pnr_no,
      data.mode_of_journey,
      data.travel_start_at?.toDate?.(),
      data.travel_end_at?.toDate?.(),
      data.advance_amount,
      data.status || BookingStatus.DRAFT,
      data.created_by || '',
      data.updated_by || '',
      data.is_deleted || false,
      data.archived_at?.toDate?.(),
      data.created_at.toDate(),
      data.updated_at.toDate()
    );
  }
}
