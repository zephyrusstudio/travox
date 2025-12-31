import { GoogleGenerativeAI } from '@google/generative-ai';
import { BookingStatus, ModeOfJourney, PAXType, Sex } from '../models/FirestoreTypes';
import { SchemaReflectionService } from './SchemaReflectionService';

export interface OCRExtractedBooking {
  // Basic booking info
  packageName?: string;
  pnrNo?: string;
  bookingDate?: string; // ISO date string
  totalAmount?: number;
  currency?: string;
  modeOfJourney?: string;
  
  // PAX information
  pax: {
    paxName: string;
    paxType: PAXType;
    sex?: Sex;
    passportNo?: string;
    dob?: string; // ISO date string
  }[];
  
  // Itinerary information
  itineraries: {
    name: string;
    seqNo: number;
    segments: {
      seqNo: number;
      modeOfJourney: ModeOfJourney;
      
      // Flight/Train/Bus specific
      carrierCode?: string;
      serviceNumber?: string;
      depCode?: string;
      arrCode?: string;
      depAt?: string; // ISO date string
      arrAt?: string; // ISO date string
      classCode?: string;
      baggage?: string;
      
      // Hotel specific
      hotelName?: string;
      hotelAddress?: string;
      checkIn?: string; // ISO date string
      checkOut?: string; // ISO date string
      roomType?: string;
      mealPlan?: string;
      
      // Activity/Other specific
      operatorName?: string;
      boardingPoint?: string;
      dropPoint?: string;
      
      // Additional data
      misc?: Record<string, any>;
    }[];
  }[];
  
  // Additional extracted info
  vendorInfo?: {
    name?: string;
    contact?: string;
    email?: string;
  };
  
  // Confidence and extraction metadata
  extractionConfidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  extractedFields?: string[];
  notes?: string;
  schemaVersion?: string; // Tracks which version of the schema was used for extraction
}

export class GeminiOCRService {
  private genAI: GoogleGenerativeAI;
  
  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async extractBookingData(
    fileBuffer: Buffer, 
    mimeType: string, 
    fileName: string
  ): Promise<OCRExtractedBooking> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemma-3-12b-it' });
      
      const systemPrompt = this.buildSystemPrompt();
      
      const imagePart = {
        inlineData: {
          data: fileBuffer.toString('base64'),
          mimeType: mimeType
        }
      };

      const prompt = `${systemPrompt}

Please analyze this travel document (${fileName}) and extract all booking-related information. Return the data in the exact JSON structure specified above.

Focus on extracting:
1. All passenger (PAX) information including names, types (ADT/CHD/INF), passport numbers, dates of birth
2. Complete itinerary details with all segments (flights, hotels, activities, etc.)
3. Booking reference numbers, PNR codes, confirmation numbers
4. Dates and times for all travel segments
5. Pricing and payment information
6. Vendor/supplier information

If any information is unclear or missing, indicate this in the notes field. Provide your confidence level based on the document quality and completeness.`;

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      
      // Clean and parse the JSON response
      const cleanedText = this.cleanJsonResponse(text);
      const extractedData = JSON.parse(cleanedText);
      
      // Validate and normalize the extracted data
      return this.validateAndNormalizeData(extractedData);
      
    } catch (error) {
      console.error('Gemini OCR extraction failed:', error);
      throw new Error(`OCR extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildSystemPrompt(): string {
    // Use dynamic schema generation that automatically reflects domain model changes
    return SchemaReflectionService.generateSystemPrompt();
  }

  private cleanJsonResponse(text: string): string {
    // Remove markdown code blocks if present
    let cleaned = text.replace(/```json\s*/, '').replace(/```\s*$/, '');
    
    // Remove any leading/trailing whitespace
    cleaned = cleaned.trim();
    
    // Find the JSON object boundaries
    const start = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (start !== -1 && lastBrace !== -1) {
      cleaned = cleaned.substring(start, lastBrace + 1);
    }
    
    return cleaned;
  }

  private validateAndNormalizeData(data: any): OCRExtractedBooking {
    // Use dynamic validation that adapts to domain model changes
    const validation = SchemaReflectionService.validateExtractedData(data);
    
    if (!validation.valid) {
      console.warn('OCR validation warnings:', validation.errors);
      // Add validation warnings to notes instead of throwing
      if (!data.notes) {
        data.notes = '';
      }
      data.notes += `\nValidation warnings: ${validation.errors.join('; ')}`;
      
      // Reduce confidence if there are validation errors
      if (data.extractionConfidence === 'HIGH') {
        data.extractionConfidence = 'MEDIUM';
      } else if (data.extractionConfidence === 'MEDIUM') {
        data.extractionConfidence = 'LOW';
      }
    }

    // Ensure required arrays exist
    if (!Array.isArray(data.pax)) {
      data.pax = [];
    }
    if (!Array.isArray(data.itineraries)) {
      data.itineraries = [];
    }
    if (!Array.isArray(data.extractedFields)) {
      data.extractedFields = [];
    }

    // Validate PAX types and apply defaults
    data.pax.forEach((pax: any, index: number) => {
      if (!pax.paxName) {
        throw new Error(`PAX ${index + 1} missing required paxName`);
      }
      if (pax.paxType && !Object.values(PAXType).includes(pax.paxType)) {
        pax.paxType = PAXType.ADT; // Default to adult
      }
    });

    // Validate itineraries and segments with defaults
    data.itineraries.forEach((itinerary: any, iIndex: number) => {
      if (!itinerary.name) {
        itinerary.name = `Itinerary ${iIndex + 1}`;
      }
      if (typeof itinerary.seqNo !== 'number') {
        itinerary.seqNo = iIndex + 1;
      }
      
      if (!Array.isArray(itinerary.segments)) {
        itinerary.segments = [];
      }
      
      itinerary.segments.forEach((segment: any, sIndex: number) => {
        if (typeof segment.seqNo !== 'number') {
          segment.seqNo = sIndex + 1;
        }
        if (!segment.modeOfJourney || !Object.values(ModeOfJourney).includes(segment.modeOfJourney)) {
          segment.modeOfJourney = ModeOfJourney.OTHER;
        }
      });
    });

    // Set default confidence if not provided
    if (!data.extractionConfidence) {
      data.extractionConfidence = 'MEDIUM';
    }

    // Add schema version for tracking
    data.schemaVersion = SchemaReflectionService.getSchemaVersion();

    return data as OCRExtractedBooking;
  }

  async testConnection(): Promise<boolean> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemma-3-12b-it' });
      const result = await model.generateContent('Test connection');
      return !!result.response;
    } catch (error) {
      console.error('Gemini connection test failed:', error);
      return false;
    }
  }
}