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
    this.status = BookingStatus.CONFIRMED;
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
  }

  cancel(updatedBy: string = ''): void {
    this.status = BookingStatus.CANCELLED;
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
  }

  complete(updatedBy: string = ''): void {
    this.status = BookingStatus.COMPLETED;
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
