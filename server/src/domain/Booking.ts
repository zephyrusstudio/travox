import { BookingStatus } from '../models/FirestoreTypes';

export class Booking {
  constructor(
    public id: string,
    public orgId: string,
    public customerId: string,
    public bookingDate: Date,
    public paxCount: number,
    public currency: string,
    public totalAmount: number,
    public paidAmount: number = 0,
    public packageName?: string,
    public primaryPaxName?: string,
    public pnrNo?: string,
    public modeOfJourney?: string,
    public travelStartAt?: Date,
    public travelEndAt?: Date,
    public advanceAmount?: number,
    public status: BookingStatus = BookingStatus.DRAFT,
    public createdBy: string = '',
    public updatedBy: string = '',
    public isDeleted: boolean = false,
    public archivedAt?: Date,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  static create(
    orgId: string,
    customerId: string,
    paxCount: number,
    totalAmount: number,
    currency: string,
    createdBy: string,
    options?: {
      packageName?: string;
      primaryPaxName?: string;
      pnrNo?: string;
      modeOfJourney?: string;
      travelStartAt?: Date;
      travelEndAt?: Date;
      advanceAmount?: number;
    }
  ): Booking {
    const now = new Date();
    return new Booking(
      '',
      orgId,
      customerId,
      now,
      paxCount,
      currency,
      totalAmount,
      0,
      options?.packageName,
      options?.primaryPaxName,
      options?.pnrNo,
      options?.modeOfJourney,
      options?.travelStartAt,
      options?.travelEndAt,
      options?.advanceAmount,
      BookingStatus.DRAFT,
      createdBy,
      createdBy,
      false,
      undefined,
      now,
      now
    );
  }

  get dueAmount(): number {
    return this.totalAmount - this.paidAmount;
  }

  addPayment(amount: number, updatedBy: string = ''): void {
    this.paidAmount += amount;
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
  }

  updateStatus(status: BookingStatus, updatedBy: string = ''): void {
    this.status = status;
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
  }

  updateTravelDates(startAt?: Date, endAt?: Date, updatedBy: string = ''): void {
    this.travelStartAt = startAt;
    this.travelEndAt = endAt;
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
  }

  updateAmount(totalAmount: number, updatedBy: string = ''): void {
    this.totalAmount = totalAmount;
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
  }

  confirm(updatedBy: string = ''): void {
    // Business rule: At least 1 PAX before CONFIRMED
    if (this.paxCount < 1) {
      throw new Error('Cannot confirm booking: at least 1 PAX is required');
    }

    this.status = BookingStatus.CONFIRMED;
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
  }

  ticket(updatedBy: string = ''): void {
    // Business rule: TICKETED requires at least 1 valid segment or hotel stay
    if (!this.pnrNo && !this.travelStartAt) {
      throw new Error('Cannot ticket booking: requires PNR or travel start date (valid segment/hotel stay)');
    }

    this.status = BookingStatus.TICKETED;
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
  }

  complete(updatedBy: string = '', adminOverride: boolean = false): void {
    // Business rule: COMPLETED requires travel_end_at < now and due_amount=0 (or admin override)
    const now = new Date();
    
    if (!adminOverride) {
      if (this.travelEndAt && this.travelEndAt >= now) {
        throw new Error('Cannot complete booking: travel has not ended yet');
      }
      
      if (this.dueAmount > 0) {
        throw new Error('Cannot complete booking: outstanding due amount must be 0');
      }
    }

    this.status = BookingStatus.COMPLETED;
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
  }

  cancel(updatedBy: string = ''): void {
    this.status = BookingStatus.CANCELLED;
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
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
}
