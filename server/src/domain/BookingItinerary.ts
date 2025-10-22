
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
    const itineraryId = uuidv4();
    
    // Update all segments to have the correct itinerary ID
    segments.forEach(segment => {
      segment.itineraryId = itineraryId;
    });
    
    return new BookingItinerary(
      itineraryId,
      orgId,
      bookingId,
      name,
      seqNo,
      segments,
      now,
      now
    );
  }

  // Helper method to update segment itinerary IDs
  updateSegmentItineraryIds(): void {
    this.segments.forEach(segment => {
      segment.itineraryId = this.id;
    });
  }

  // Helper method to add a segment with correct itinerary ID
  addSegment(segment: BookingSegment): void {
    segment.itineraryId = this.id;
    this.segments.push(segment);
    this.updatedAt = new Date();
  }

  // Get itinerary data for API response
  toApiResponse(): any {
    return {
      id: this.id,
      orgId: this.orgId,
      bookingId: this.bookingId,
      name: this.name,
      seqNo: this.seqNo,
      segments: this.segments.map(s => s.toApiResponse()),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
