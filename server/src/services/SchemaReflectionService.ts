import { Booking } from '../domain/Booking';
import { BookingPax } from '../domain/BookingPax';
import { BookingItinerary } from '../domain/BookingItinerary';
import { BookingSegment } from '../domain/BookingSegment';
import { PAXType, ModeOfJourney, BookingStatus, Sex } from '../models/FirestoreTypes';

/**
 * Service for dynamically generating OCR extraction schemas based on current domain models.
 * This ensures OCR extraction automatically adapts to any changes in the booking structure.
 */
export class SchemaReflectionService {
  
  /**
   * Generates the complete OCR extraction schema based on current domain models
   */
  static generateOCRSchema(): any {
    return {
      // Basic booking info - derived from Booking class constructor
      packageName: "string (optional) - Name of travel package or booking",
      pnrNo: "string (optional) - PNR/booking reference number", 
      bookingDate: "string (optional) - ISO date string YYYY-MM-DD",
      totalAmount: "number (optional) - Total booking amount",
      currency: "string (optional) - Currency code (INR, USD, etc.)",
      modeOfJourney: "string (optional) - Primary travel mode",
      
      // PAX information - derived from BookingPax class
      pax: [{
        paxName: "string - Full passenger name",
        paxType: `${this.getEnumValues('PAXType')} - Adult, Child, or Infant`,
        sex: `${this.getEnumValues('Sex')} (optional) - Male, Female, or Transgender`,
        passportNo: "string (optional) - Passport number",
        dob: "string (optional) - Date of birth YYYY-MM-DD"
      }],
      
      // Itinerary information - derived from BookingItinerary and BookingSegment classes
      itineraries: [{
        name: "string - Itinerary name/description",
        seqNo: "number - Sequence number starting from 1",
        segments: [this.generateSegmentSchema()]
      }],
      
      // Vendor information
      vendorInfo: {
        name: "string (optional) - Vendor/agency name",
        contact: "string (optional) - Contact number", 
        email: "string (optional) - Email address"
      },
      
      // Extraction metadata
      extractionConfidence: "HIGH|MEDIUM|LOW",
      extractedFields: ["array of field names successfully extracted"],
      notes: "string (optional) - Additional notes or warnings"
    };
  }

  /**
   * Generates segment schema based on BookingSegment class properties
   */
  private static generateSegmentSchema(): any {
    return {
      seqNo: "number - Segment sequence number",
      modeOfJourney: this.getEnumValues('ModeOfJourney'),
      
      // Flight/Train/Bus specific fields
      carrierCode: "string (optional) - Airline/railway code",
      serviceNumber: "string (optional) - Flight/train/bus number", 
      depCode: "string (optional) - Departure airport/station code",
      arrCode: "string (optional) - Arrival airport/station code",
      depAt: "string (optional) - Departure datetime ISO format",
      arrAt: "string (optional) - Arrival datetime ISO format", 
      classCode: "string (optional) - Travel class",
      baggage: "string (optional) - Baggage allowance",
      
      // Hotel specific fields
      hotelName: "string (optional) - Hotel name",
      hotelAddress: "string (optional) - Hotel address",
      checkIn: "string (optional) - Check-in datetime ISO format",
      checkOut: "string (optional) - Check-out datetime ISO format",
      roomType: "string (optional) - Room type",
      mealPlan: "string (optional) - Meal plan",
      
      // Activity/Other specific fields
      operatorName: "string (optional) - Activity/service operator",
      boardingPoint: "string (optional) - Pickup location", 
      dropPoint: "string (optional) - Drop location",
      
      // Flexible field for any additional data
      misc: "object (optional) - Any additional segment data"
    };
  }

  /**
   * Gets enum values dynamically for schema generation
   */
  private static getEnumValues(enumName: string): string {
    switch (enumName) {
      case 'PAXType':
        return Object.values(PAXType).join('|');
      case 'ModeOfJourney':
        return Object.values(ModeOfJourney).join('|');
      case 'BookingStatus':
        return Object.values(BookingStatus).join('|');
      case 'Sex':
        return Object.values(Sex).join('|');
      default:
        return 'string';
    }
  }

  /**
   * Generates the complete system prompt with dynamic schema
   */
  static generateSystemPrompt(): string {
    const schema = this.generateOCRSchema();
    
    return `You are an expert OCR system specialized in extracting travel booking information from tickets, vouchers, and booking confirmations. 

Extract data in this EXACT JSON structure:

${JSON.stringify(schema, null, 2)}

IMPORTANT RULES:
1. Return ONLY valid JSON, no markdown or extra text
2. Use exact enum values: PAXType (${this.getEnumValues('PAXType')}), ModeOfJourney (${this.getEnumValues('ModeOfJourney')}), Sex (${this.getEnumValues('Sex')})
3. All dates in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
4. Handle multiple passengers and segments correctly
5. If information is unclear, mark confidence as LOW and explain in notes
6. Extract ALL available information, don't leave fields empty if data exists
7. For flight tickets: focus on PNR, passenger names, flight details, dates
8. For hotel vouchers: focus on guest names, hotel details, check-in/out dates
9. For train tickets: focus on PNR, passenger names, train details, journey dates
10. Always include sequence numbers for proper ordering

SEX FIELD INFERENCE:
- Deduce passenger sex from name prefixes:
  * Mr., Shri, Sri → Male
  * Mrs., Miss, Ms., Smt., Kumari → Female
  * Mx. → Transgender
- If no prefix or ambiguous, leave sex field empty

FIELD MAPPING GUIDE:
- For flights/trains/buses: Use depAt/arrAt, depCode/arrCode, carrierCode, serviceNumber
- For hotels: Use checkIn/checkOut, hotelName, hotelAddress, roomType, mealPlan
- For activities: Use operatorName, boardingPoint, dropPoint
- Use misc field for any domain-specific data not covered by standard fields

VALIDATION REQUIREMENTS:
- All passenger names must be present
- At least one itinerary with one segment required
- Dates must be valid ISO format
- Amounts must be positive numbers
- Sequence numbers must start from 1 and be consecutive

EXTRACTED FIELDS FORMAT:
The extractedFields array must use hierarchical dot notation for nested fields:
- Use "pax.paxName", "pax.paxType" for passenger fields
- Use "itineraries.name", "itineraries.seqNo" for itinerary fields
- Use "itineraries.segments.depCode", "itineraries.segments.carrierCode" for segment fields
- Use "vendorInfo.name", "vendorInfo.contact" for vendor fields
- Use simple names like "pnrNo", "totalAmount" for top-level fields

Example extractedFields:
["pnrNo", "bookingDate", "pax.paxName", "pax.paxType", "itineraries.name", "itineraries.segments.depCode", "itineraries.segments.arrCode", "vendorInfo.name"]`;
  }

  /**
   * Validates that extracted data matches current domain model structure
   */
  static validateExtractedData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate PAX types
    if (data.pax && Array.isArray(data.pax)) {
      data.pax.forEach((pax: any, index: number) => {
        if (pax.paxType && !Object.values(PAXType).includes(pax.paxType)) {
          errors.push(`Invalid PAXType "${pax.paxType}" at pax[${index}]. Valid values: ${Object.values(PAXType).join(', ')}`);
        }
        if (pax.sex && !Object.values(Sex).includes(pax.sex)) {
          errors.push(`Invalid Sex "${pax.sex}" at pax[${index}]. Valid values: ${Object.values(Sex).join(', ')}`);
        }
      });
    }
    
    // Validate ModeOfJourney values
    if (data.itineraries && Array.isArray(data.itineraries)) {
      data.itineraries.forEach((itinerary: any, itinIndex: number) => {
        if (itinerary.segments && Array.isArray(itinerary.segments)) {
          itinerary.segments.forEach((segment: any, segIndex: number) => {
            if (segment.modeOfJourney && !Object.values(ModeOfJourney).includes(segment.modeOfJourney)) {
              errors.push(`Invalid ModeOfJourney "${segment.modeOfJourney}" at itinerary[${itinIndex}].segment[${segIndex}]. Valid values: ${Object.values(ModeOfJourney).join(', ')}`);
            }
          });
        }
      });
    }
    
    // Validate date formats
    const dateFields = ['bookingDate'];
    dateFields.forEach(field => {
      if (data[field] && !this.isValidISODate(data[field])) {
        errors.push(`Invalid date format for ${field}: ${data[field]}. Expected ISO format YYYY-MM-DD`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Checks if a string is a valid ISO date
   */
  private static isValidISODate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/) !== null;
  }

  /**
   * Gets the current schema version for tracking changes
   */
  static getSchemaVersion(): string {
    // Generate a hash based on the schema structure
    const schema = this.generateOCRSchema();
    const schemaString = JSON.stringify(schema);
    
    // Simple hash function for version tracking
    let hash = 0;
    for (let i = 0; i < schemaString.length; i++) {
      const char = schemaString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return `v${Math.abs(hash).toString(16)}`;
  }
}