
import { ModeOfJourney } from '../models/FirestoreTypes';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentISTDate } from '../utils/timezone';

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
    public createdAt: Date = getCurrentISTDate(),
    public updatedAt: Date = getCurrentISTDate()
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
    const now = getCurrentISTDate();
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

  /**
   * Validates if the segment has minimum required data based on its mode of journey
   */
  isValid(): boolean {
    try {
      this.validate();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validates the segment and throws error if required fields are missing
   */
  validate(): void {
    switch (this.modeOfJourney) {
      case ModeOfJourney.FLIGHT:
        if (!this.depCode) {
          throw new Error('Departure code is required for flight segments');
        }
        break;
        
      case ModeOfJourney.HOTEL:
        if (!this.hotelName) {
          throw new Error('Hotel name is required for hotel segments');
        }
        break;
        
      case ModeOfJourney.TRAIN:
      case ModeOfJourney.BUS:
        if (!this.depCode && !this.boardingPoint) {
          throw new Error('Either departure code or boarding point is required for ground transport');
        }
        break;
    }
  }

  /**
   * Returns a clean object for API responses, ensuring no undefined values
   */
  toApiResponse(): any {
    return {
      id: this.id,
      orgId: this.orgId,
      itineraryId: this.itineraryId,
      seqNo: this.seqNo,
      modeOfJourney: this.modeOfJourney,
      carrierCode: this.carrierCode || null,
      serviceNumber: this.serviceNumber || null,
      depCode: this.depCode || null,
      arrCode: this.arrCode || null,
      depAt: this.depAt || null,
      arrAt: this.arrAt || null,
      classCode: this.classCode || null,
      baggage: this.baggage || null,
      hotelName: this.hotelName || null,
      hotelAddress: this.hotelAddress || null,
      checkIn: this.checkIn || null,
      checkOut: this.checkOut || null,
      roomType: this.roomType || null,
      mealPlan: this.mealPlan || null,
      operatorName: this.operatorName || null,
      boardingPoint: this.boardingPoint || null,
      dropPoint: this.dropPoint || null,
      misc: this.misc || null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
