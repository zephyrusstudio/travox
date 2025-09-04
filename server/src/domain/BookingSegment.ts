
import { ModeOfJourney } from '../models/FirestoreTypes';
import { v4 as uuidv4 } from 'uuid';

export class BookingSegment {
  constructor(
    public id: string,
    public orgId: string,
    public itineraryId: string,
    public seqNo: number,
    public modeOfJourney: ModeOfJourney,
    public carrierCode?: string,
    public serviceNumber?: string,
    public depCode?: string,
    public arrCode?: string,
    public depAt?: Date,
    public arrAt?: Date,
    public classCode?: string,
    public baggage?: string,
    public hotelName?: string,
    public hotelAddress?: string,
    public checkIn?: Date,
    public checkOut?: Date,
    public roomType?: string,
    public mealPlan?: string,
    public operatorName?: string,
    public boardingPoint?: string,
    public dropPoint?: string,
    public misc?: Record<string, any>,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  static create(
    orgId: string,
    itineraryId: string,
    seqNo: number,
    modeOfJourney: ModeOfJourney,
    options: {
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
  ): BookingSegment {
    const now = new Date();
    return new BookingSegment(
      uuidv4(),
      orgId,
      itineraryId,
      seqNo,
      modeOfJourney,
      options.carrierCode,
      options.serviceNumber,
      options.depCode,
      options.arrCode,
      options.depAt,
      options.arrAt,
      options.classCode,
      options.baggage,
      options.hotelName,
      options.hotelAddress,
      options.checkIn,
      options.checkOut,
      options.roomType,
      options.mealPlan,
      options.operatorName,
      options.boardingPoint,
      options.dropPoint,
      options.misc,
      now,
      now
    );
  }
}
