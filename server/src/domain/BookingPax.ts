import { PAXType } from '../models/FirestoreTypes';
import { v4 as uuidv4 } from 'uuid';

export class BookingPax {
  constructor(
    public id: string,
    public orgId: string,
    public bookingId: string,
    public paxName: string,
    public paxType: PAXType,
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
      options?.passportNo,
      options?.dob,
      now,
      now
    );
  }
}