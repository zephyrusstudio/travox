
import { BookingSegment } from './BookingSegment';
import { v4 as uuidv4 } from 'uuid';

export class BookingItinerary {
  constructor(
    public id: string,
    public orgId: string,
    public bookingId: string,
    public name: string,
    public seqNo: number,
    public segments: BookingSegment[] = [],
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  static create(
    orgId: string,
    bookingId: string,
    name: string,
    seqNo: number,
    segments: BookingSegment[] = []
  ): BookingItinerary {
    const now = new Date();
    return new BookingItinerary(
      uuidv4(),
      orgId,
      bookingId,
      name,
      seqNo,
      segments,
      now,
      now
    );
  }
}
