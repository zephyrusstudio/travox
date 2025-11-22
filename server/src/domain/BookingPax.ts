import { PAXType, Sex } from '../models/FirestoreTypes';
import { v4 as uuidv4 } from 'uuid';

export class BookingPax {
  constructor(
    public id: string,
    public orgId: string,
    public bookingId: string,
    public paxName: string,
    public paxType: PAXType,
    public sex?: Sex,
    public passportNo?: string,
    public dob?: Date,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  static create(
    orgId: string,
    bookingId: string,
    paxName: string,
    paxType: PAXType,
    options?: {
      sex?: Sex;
      passportNo?: string;
      dob?: Date;
    }
  ): BookingPax {
    const now = new Date();
    return new BookingPax(
      uuidv4(),
      orgId,
      bookingId,
      paxName,
      paxType,
      options?.sex,
      options?.passportNo,
      options?.dob,
      now,
      now
    );
  }

  // Data masking method for passport
  getMaskedPassport(): string | undefined {
    if (!this.passportNo) return undefined;
    if (this.passportNo.length <= 4) return 'XXXX';
    return `${this.passportNo.slice(0, 2)}XXXX${this.passportNo.slice(-2)}`;
  }

  // Get pax data for API response with optional unmasking of sensitive fields
  toApiResponse(unmask: boolean = false): any {
    return {
      id: this.id,
      orgId: this.orgId,
      bookingId: this.bookingId,
      paxName: this.paxName,
      paxType: this.paxType,
      sex: this.sex,
      passportNo: unmask ? this.passportNo : this.getMaskedPassport(),
      dob: this.dob,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}