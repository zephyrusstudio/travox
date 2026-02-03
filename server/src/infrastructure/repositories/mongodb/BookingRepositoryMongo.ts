import { injectable } from 'tsyringe';
import { IBookingRepository } from '../../../application/repositories/IBookingRepository';
import { Booking } from '../../../domain/Booking';
import { BookingPax } from '../../../domain/BookingPax';
import { BookingItinerary } from '../../../domain/BookingItinerary';
import { BookingSegment } from '../../../domain/BookingSegment';
import { BookingModel } from '../../../models/mongoose/BookingModel';
import { BookingStatus, PAXType, ModeOfJourney } from '../../../models/FirestoreTypes';
import { BookingSearchParams, BookingFilterParams } from '../../../application/useCases/booking/GetBookings';

@injectable()
export class BookingRepositoryMongo implements IBookingRepository {

  private toDomain(doc: any): Booking {
    const pax = (doc.pax || []).map((p: any) => new BookingPax(
      p.id,
      p.orgId,
      p.bookingId,
      p.paxName,
      p.paxType as PAXType,
      p.sex,
      p.passportNo,
      p.dob,
      p.createdAt,
      p.updatedAt
    ));

    const itineraries = (doc.itineraries || []).map((i: any) => new BookingItinerary(
      i.id,
      i.orgId,
      i.bookingId,
      i.name,
      i.seqNo,
      (i.segments || []).map((s: any) => new BookingSegment(
        s.id,
        s.orgId,
        s.itineraryId,
        s.seqNo,
        s.modeOfJourney as ModeOfJourney,
        s.carrierCode,
        s.serviceNumber,
        s.depCode,
        s.arrCode,
        s.depAt,
        s.arrAt,
        s.classCode,
        s.baggage,
        s.hotelName,
        s.hotelAddress,
        s.checkIn,
        s.checkOut,
        s.roomType,
        s.mealPlan,
        s.operatorName,
        s.boardingPoint,
        s.dropPoint,
        s.misc,
        s.createdAt,
        s.updatedAt
      )),
      i.createdAt,
      i.updatedAt
    ));

    return new Booking(
      doc._id.toString(),
      doc.orgId,
      doc.customerId,
      doc.bookingDate,
      doc.currency,
      doc.totalAmount,
      pax,
      itineraries,
      doc.paidAmount || 0,
      doc.dueAmount !== undefined ? doc.dueAmount : (doc.totalAmount - (doc.paidAmount || 0)),
      doc.packageName,
      doc.pnrNo,
      doc.modeOfJourney,
      doc.advanceAmount,
      doc.status || BookingStatus.DRAFT,
      doc.vendorId,
      doc.createdBy || '',
      doc.updatedBy || '',
      doc.isDeleted || false,
      doc.archivedAt,
      doc.createdAt,
      doc.updatedAt,
      doc.ticketId
    );
  }

  private toMongoDoc(booking: Booking): any {
    return {
      orgId: booking.orgId,
      customerId: booking.customerId,
      bookingDate: booking.bookingDate,
      currency: booking.currency,
      totalAmount: booking.totalAmount,
      paidAmount: booking.paidAmount,
      dueAmount: booking.dueAmount,
      status: booking.status,
      vendorId: booking.vendorId || null,
      createdBy: booking.createdBy,
      updatedBy: booking.updatedBy,
      isDeleted: booking.isDeleted,
      archivedAt: booking.archivedAt || null,
      paxCount: booking.pax.length,
      primaryPaxName: booking.pax[0]?.paxName || null,
      travelStartAt: booking.travelStartAt || null,
      travelEndAt: booking.travelEndAt || null,
      packageName: booking.packageName || null,
      pnrNo: booking.pnrNo || null,
      modeOfJourney: booking.modeOfJourney || null,
      advanceAmount: booking.advanceAmount || null,
      ticketId: booking.ticketId || null,
      pax: booking.pax.map(p => ({
        id: p.id,
        orgId: p.orgId,
        bookingId: p.bookingId,
        paxName: p.paxName,
        paxType: p.paxType,
        sex: p.sex || null,
        passportNo: p.passportNo || null,
        dob: p.dob || null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      itineraries: booking.itineraries.map(i => ({
        id: i.id,
        orgId: i.orgId,
        bookingId: i.bookingId,
        name: i.name,
        seqNo: i.seqNo,
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,
        segments: i.segments.map(s => ({
          id: s.id,
          orgId: s.orgId,
          itineraryId: s.itineraryId,
          seqNo: s.seqNo,
          modeOfJourney: s.modeOfJourney,
          carrierCode: s.carrierCode || null,
          serviceNumber: s.serviceNumber || null,
          depCode: s.depCode || null,
          arrCode: s.arrCode || null,
          depAt: s.depAt || null,
          arrAt: s.arrAt || null,
          classCode: s.classCode || null,
          baggage: s.baggage || null,
          hotelName: s.hotelName || null,
          hotelAddress: s.hotelAddress || null,
          checkIn: s.checkIn || null,
          checkOut: s.checkOut || null,
          roomType: s.roomType || null,
          mealPlan: s.mealPlan || null,
          operatorName: s.operatorName || null,
          boardingPoint: s.boardingPoint || null,
          dropPoint: s.dropPoint || null,
          misc: s.misc || null,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        }))
      }))
    };
  }

  async create(booking: Booking, orgId: string): Promise<Booking> {
    const docData = this.toMongoDoc(booking);
    const doc = new BookingModel(docData);
    const saved = await doc.save();
    
    // Update the booking ID to the actual MongoDB document ID
    booking.id = saved._id.toString();
    
    // Update all child entities to use the actual booking ID
    booking.pax.forEach(pax => {
      pax.bookingId = saved._id.toString();
    });
    
    booking.itineraries.forEach(itinerary => {
      itinerary.bookingId = saved._id.toString();
    });
    
    return booking;
  }

  async findById(id: string, orgId: string): Promise<Booking | null> {
    const doc = await BookingModel.findOne({ _id: id, orgId });
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByCustomerId(customerId: string, orgId: string): Promise<Booking[]> {
    const docs = await BookingModel.find({ 
      orgId, 
      customerId, 
      isDeleted: false 
    }).sort({ createdAt: -1 });
    return docs.map(doc => this.toDomain(doc));
  }

  async findByPNR(pnr: string, orgId: string): Promise<Booking | null> {
    const doc = await BookingModel.findOne({ 
      orgId, 
      pnrNo: pnr, 
      isDeleted: false 
    });
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByStatus(status: BookingStatus, orgId: string): Promise<Booking[]> {
    const docs = await BookingModel.find({ 
      orgId, 
      status, 
      isDeleted: false 
    }).sort({ createdAt: -1 });
    return docs.map(doc => this.toDomain(doc));
  }

  async findByDateRange(startDate: Date, endDate: Date, orgId: string): Promise<Booking[]> {
    const docs = await BookingModel.find({
      orgId,
      bookingDate: { $gte: startDate, $lte: endDate },
      isDeleted: false
    }).sort({ createdAt: -1 });
    return docs.map(doc => this.toDomain(doc));
  }

  async findAll(orgId: string, limit?: number, offset?: number): Promise<Booking[]> {
    let query = BookingModel.find({ orgId, isDeleted: false })
      .sort({ createdAt: -1 });

    if (offset) {
      query = query.skip(offset);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const docs = await query.exec();
    return docs.map(doc => this.toDomain(doc));
  }

  async countAll(orgId: string): Promise<number> {
    return await BookingModel.countDocuments({ orgId, isDeleted: false });
  }

  async update(booking: Booking, orgId: string): Promise<Booking> {
    booking.updatedAt = new Date();
    const docData = this.toMongoDoc(booking);
    
    await BookingModel.findOneAndUpdate(
      { _id: booking.id, orgId },
      docData,
      { new: true }
    );
    
    return booking;
  }

  async updateFields(id: string, fields: Record<string, any>, orgId: string): Promise<boolean> {
    const doc = await this.findById(id, orgId);
    if (!doc) {
      throw new Error('Booking not found or not authorized');
    }

    await BookingModel.findOneAndUpdate(
      { _id: id, orgId },
      { ...fields, updatedAt: new Date() }
    );
    
    return true;
  }

  async softDelete(id: string, orgId: string, updatedBy: string): Promise<boolean> {
    const doc = await this.findById(id, orgId);
    if (!doc) {
      throw new Error('Booking not found or not authorized');
    }

    await BookingModel.findOneAndUpdate(
      { _id: id, orgId },
      { isDeleted: true, updatedBy, updatedAt: new Date() }
    );
    
    return true;
  }

  async archive(id: string, orgId: string, updatedBy: string): Promise<boolean> {
    const doc = await this.findById(id, orgId);
    if (!doc) {
      throw new Error('Booking not found or not authorized');
    }

    await BookingModel.findOneAndUpdate(
      { _id: id, orgId },
      { archivedAt: new Date(), updatedBy, updatedAt: new Date() }
    );
    
    return true;
  }

  async getUpcomingBookings(orgId: string, days: number = 30): Promise<Booking[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));

    const docs = await BookingModel.find({
      orgId,
      travelStartAt: { $gte: now, $lte: futureDate },
      isDeleted: false
    }).sort({ createdAt: -1 });
    
    return docs.map(doc => this.toDomain(doc));
  }

  async getBookingsByTravelDates(startDate: Date, endDate: Date, orgId: string): Promise<Booking[]> {
    const docs = await BookingModel.find({
      orgId,
      travelStartAt: { $gte: startDate, $lte: endDate },
      isDeleted: false
    }).sort({ createdAt: -1 });
    
    return docs.map(doc => this.toDomain(doc));
  }

  async getRevenueStats(orgId: string, startDate?: Date, endDate?: Date): Promise<any> {
    const matchStage: any = {
      orgId,
      isDeleted: false,
      status: { $ne: BookingStatus.CANCELLED }
    };

    if (startDate) {
      matchStage.bookingDate = matchStage.bookingDate || {};
      matchStage.bookingDate.$gte = startDate;
    }
    if (endDate) {
      matchStage.bookingDate = matchStage.bookingDate || {};
      matchStage.bookingDate.$lte = endDate;
    }

    const docs = await BookingModel.find(matchStage);
    const bookings = docs.map(doc => this.toDomain(doc));
    
    const totalRevenue = bookings.reduce((sum, b) => sum + b.paidAmount, 0);
    const totalAmount = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const paidAmount = bookings.reduce((sum, b) => sum + b.paidAmount, 0);
    
    const forecastBookings = bookings.filter(b => 
      b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.REFUNDED
    );
    const revenueForecast = forecastBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    
    return {
      totalRevenue,
      paidAmount,
      dueAmount: totalAmount - paidAmount,
      bookingCount: bookings.length,
      revenueForecast
    };
  }

  async getStats(orgId: string): Promise<{
    totalBookings: number;
    confirmedBookings: number;
    totalRevenue: number;
    revenueForecast: number;
    pendingAmount: number;
  }> {
    const docs = await BookingModel.find({ orgId, isDeleted: false });
    const allBookings = docs.map(doc => this.toDomain(doc));
    
    const confirmedStatuses = [
      BookingStatus.CONFIRMED,
      BookingStatus.TICKETED,
      BookingStatus.IN_PROGRESS,
      BookingStatus.COMPLETED
    ];
    const confirmedBookings = allBookings.filter(b => confirmedStatuses.includes(b.status));
    
    const nonCancelledBookings = allBookings.filter(b => b.status !== BookingStatus.CANCELLED);
    const totalRevenue = nonCancelledBookings.reduce((sum, b) => sum + b.paidAmount, 0);
    const pendingAmount = nonCancelledBookings.reduce((sum, b) => sum + b.dueAmount, 0);
    
    const forecastBookings = allBookings.filter(b => 
      b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.REFUNDED
    );
    const revenueForecast = forecastBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    
    return {
      totalBookings: allBookings.length,
      confirmedBookings: confirmedBookings.length,
      totalRevenue,
      revenueForecast,
      pendingAmount
    };
  }

  async updatePayment(bookingId: string, paidAmount: number, orgId: string, updatedBy: string): Promise<boolean> {
    const doc = await this.findById(bookingId, orgId);
    if (!doc) {
      throw new Error('Booking not found or not authorized');
    }

    await BookingModel.findOneAndUpdate(
      { _id: bookingId, orgId },
      { paidAmount, updatedBy, updatedAt: new Date() }
    );
    
    return true;
  }

  async getOverdueBookings(orgId: string): Promise<Booking[]> {
    const now = new Date();
    const docs = await BookingModel.find({
      orgId,
      travelEndAt: { $lt: now },
      isDeleted: false,
      status: { $in: [BookingStatus.CONFIRMED, BookingStatus.TICKETED, BookingStatus.IN_PROGRESS] }
    }).sort({ createdAt: -1 });

    const bookings = docs.map(doc => this.toDomain(doc));
    return bookings.filter(booking => booking.dueAmount > 0);
  }

  async search(params: BookingSearchParams, orgId: string, matchingCustomerIds?: string[]): Promise<Booking[]> {
    const query: any = { orgId, isDeleted: false };

    if (params.customerId) {
      query.customerId = params.customerId;
    }

    if (params.pnrNo) {
      query.pnrNo = params.pnrNo;
    }

    if (params.modeOfJourney) {
      query.modeOfJourney = params.modeOfJourney;
    }

    let docs = await BookingModel.find(query).sort({ createdAt: -1 });
    let bookings = docs.map(doc => this.toDomain(doc));

    if (params.packageName) {
      const searchTerm = params.packageName.toLowerCase();
      bookings = bookings.filter(b => b.packageName?.toLowerCase().includes(searchTerm));
    }

    if (params.primaryPaxName) {
      const searchTerm = params.primaryPaxName.toLowerCase();
      bookings = bookings.filter(b => b.primaryPaxName?.toLowerCase().includes(searchTerm));
    }

    if (params.q) {
      const searchTerm = params.q.toLowerCase();
      bookings = bookings.filter(b => {
        const matchesBookingFields = (
          b.pnrNo?.toLowerCase().includes(searchTerm) ||
          b.packageName?.toLowerCase().includes(searchTerm) ||
          b.primaryPaxName?.toLowerCase().includes(searchTerm) ||
          b.modeOfJourney?.toLowerCase().includes(searchTerm) ||
          b.pax.some(p => p.paxName?.toLowerCase().includes(searchTerm))
        );
        
        const matchesCustomerName = matchingCustomerIds?.includes(b.customerId) ?? false;
        
        return matchesBookingFields || matchesCustomerName;
      });
    } else if (matchingCustomerIds && matchingCustomerIds.length > 0) {
      bookings = bookings.filter(b => matchingCustomerIds.includes(b.customerId));
    }

    if (params.offset) {
      bookings = bookings.slice(params.offset);
    }

    if (params.limit) {
      bookings = bookings.slice(0, params.limit);
    }

    return bookings;
  }

  async filter(params: BookingFilterParams, orgId: string): Promise<Booking[]> {
    const docs = await BookingModel.find({ orgId, isDeleted: false }).sort({ createdAt: -1 });
    let bookings = docs.map(doc => this.toDomain(doc));

    if (params.status) {
      bookings = bookings.filter(b => b.status === params.status);
    }

    if (params.paymentStatus) {
      bookings = bookings.filter(b => {
        const dueAmount = b.dueAmount;
        const totalAmount = b.totalAmount;
        
        switch (params.paymentStatus) {
          case 'paid':
            return dueAmount === 0;
          case 'unpaid':
            return dueAmount === totalAmount;
          case 'partial':
            return dueAmount > 0 && dueAmount < totalAmount;
          default:
            return true;
        }
      });
    }

    if (params.bookingDateFrom || params.bookingDateTo) {
      bookings = bookings.filter(b => {
        const bookingTime = b.bookingDate.getTime();
        if (params.bookingDateFrom && bookingTime < params.bookingDateFrom.getTime()) {
          return false;
        }
        if (params.bookingDateTo && bookingTime > params.bookingDateTo.getTime()) {
          return false;
        }
        return true;
      });
    }

    if (params.travelStartFrom || params.travelStartTo) {
      bookings = bookings.filter(b => {
        if (!b.travelStartAt) return false;
        const travelStartTime = b.travelStartAt.getTime();
        if (params.travelStartFrom && travelStartTime < params.travelStartFrom.getTime()) {
          return false;
        }
        if (params.travelStartTo && travelStartTime > params.travelStartTo.getTime()) {
          return false;
        }
        return true;
      });
    }

    if (params.travelEndFrom || params.travelEndTo) {
      bookings = bookings.filter(b => {
        if (!b.travelEndAt) return false;
        const travelEndTime = b.travelEndAt.getTime();
        if (params.travelEndFrom && travelEndTime < params.travelEndFrom.getTime()) {
          return false;
        }
        if (params.travelEndTo && travelEndTime > params.travelEndTo.getTime()) {
          return false;
        }
        return true;
      });
    }

    if (params.dueAmountMin !== undefined || params.dueAmountMax !== undefined) {
      bookings = bookings.filter(b => {
        const dueAmount = b.dueAmount;
        if (params.dueAmountMin !== undefined && dueAmount < params.dueAmountMin) {
          return false;
        }
        if (params.dueAmountMax !== undefined && dueAmount > params.dueAmountMax) {
          return false;
        }
        return true;
      });
    }

    if (params.offset) {
      bookings = bookings.slice(params.offset);
    }

    if (params.limit) {
      bookings = bookings.slice(0, params.limit);
    }

    return bookings;
  }

  /**
   * No-op for base MongoDB repository (only cached repo needs this)
   */
  async invalidateCacheForBooking(bookingId: string, orgId: string): Promise<void> {
    // No-op: Base repository doesn't use cache
  }
}
