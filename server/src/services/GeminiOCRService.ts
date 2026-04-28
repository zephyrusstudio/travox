import { GoogleGenerativeAI } from '@google/generative-ai';
import { BookingStatus, ModeOfJourney, PAXType, Sex } from '../models/FirestoreTypes';
import { SchemaReflectionService } from './SchemaReflectionService';

const DEFAULT_GEMINI_MODEL = 'gemma-3-12b-it';

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
  private modelName: string;
  
  constructor(apiKey: string, modelName: string = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
  }

  async extractBookingData(
    fileBuffer: Buffer, 
    mimeType: string, 
    fileName: string
  ): Promise<OCRExtractedBooking> {
    try {
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

Accuracy rules:
- Read only the visible document text. Do not infer passenger, hotel, route, PNR, or amount from the filename.
- Preserve passenger names exactly as printed. Do not split, translate, or "correct" names.
- A passenger token like "NAME+5" means one visible passenger plus unnamed companions. Extract only "NAME"; do not invent the companions.
- If a field is not printed or is ambiguous, omit it instead of guessing.
- For accommodation/hotel vouchers, use modeOfJourney HOTEL and put stay dates in checkIn/checkOut, not depAt/arrAt.
- If a travel segment has only one date and no time, prefer depAt for the date and leave arrAt empty unless an arrival date is printed.
- For sales/customer-detail receipts, row DATE is invoice/credit date only. Never use row DATE for depAt/arrAt when memo/description has a travel date.
- Travel date examples: "23RD MAR" means 2026-03-23 when the report period is in 2026; "24TH FEB" means 2026-02-24. Do not combine the memo day with the invoice row month.
- In invoice-table memo/description cells, parse stacked lines as passenger, route, travel date, class. Example: "ARPAN NAYEK+1 / APDJ TO SDAH / 23RD MAR / SL" means passenger ARPAN NAYEK, depCode APDJ, arrCode SDAH, depAt 2026-03-23, classCode SL.
- Ignore Credit Memo, Refund, and TICKET CANCELLED rows when building active passengers and itinerary segments.
- If a receipt contains invoice totals plus credit memo/refund totals, use the final net TOTAL as totalAmount. Otherwise use the booking/invoice total.
- Only set pnrNo when the document labels a value as PNR, booking reference, reservation number, confirmation number, or voucher number.
- Ignore totals unrelated to booking price, such as tax footers, page numbers, phone numbers, account IDs, and serial numbers.

If any information is unclear or missing, indicate this in the notes field. Provide your confidence level based on the document quality and completeness.`;

      const text = await this.generateText(prompt, imagePart);
      
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

  private async generateText(prompt: string, imagePart: any): Promise<string> {
    const supportsJsonMode = !this.modelName.startsWith('gemma-');
    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: supportsJsonMode
        ? {
            temperature: 0,
            responseMimeType: 'application/json',
          }
        : {
            temperature: 0,
          },
    });

    try {
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      return response.text();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (supportsJsonMode && message.includes('JSON mode is not enabled')) {
        const fallbackModel = this.genAI.getGenerativeModel({
          model: this.modelName,
          generationConfig: {
            temperature: 0,
          },
        });
        const result = await fallbackModel.generateContent([prompt, imagePart]);
        const response = await result.response;
        return response.text();
      }

      throw error;
    }
  }

  private buildSystemPrompt(): string {
    // Use dynamic schema generation that automatically reflects domain model changes
    return SchemaReflectionService.generateSystemPrompt();
  }

  private cleanJsonResponse(text: string): string {
    // Remove markdown code blocks if present
    let cleaned = text.replace(/```(?:json)?/gi, '').replace(/```/g, '');
    
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

  private normalizeAmount(value: any): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;

    if (typeof value === 'number') {
      return Number.isFinite(value) && value > 0 ? value : undefined;
    }

    const numeric = Number(String(value).replace(/[^\d.-]/g, ''));
    return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined;
  }

  private normalizeDate(value: any): string | undefined {
    if (!value) return undefined;

    const raw = String(value).trim();
    if (!raw) return undefined;

    if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d{3})?Z?)?$/.test(raw)) {
      return raw;
    }

    const dmy = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:[,\s]+(\d{1,2}):(\d{2})(?:\s*([AP]M))?)?/i);
    if (dmy) {
      const [, day, month, year, hour, minute, meridiem] = dmy;
      const fullYear = year.length === 2 ? `20${year}` : year;
      let normalizedHour = hour ? Number(hour) : undefined;
      if (normalizedHour !== undefined && meridiem) {
        const upper = meridiem.toUpperCase();
        if (upper === 'PM' && normalizedHour < 12) normalizedHour += 12;
        if (upper === 'AM' && normalizedHour === 12) normalizedHour = 0;
      }

      const date = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      if (normalizedHour === undefined || !minute) return date;
      return `${date}T${String(normalizedHour).padStart(2, '0')}:${minute}:00`;
    }

    return undefined;
  }

  private normalizePaxType(value: any): PAXType {
    const normalized = String(value || '').trim().toUpperCase();
    if (['CHD', 'CHILD', 'CNN'].includes(normalized)) return PAXType.CHD;
    if (['INF', 'INFANT'].includes(normalized)) return PAXType.INF;
    return PAXType.ADT;
  }

  private normalizePaxName(value: any): string {
    return String(value || '')
      .replace(/\s*\+\s*\d+\s*$/u, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizeSex(value: any): Sex | undefined {
    const normalized = String(value || '').trim().toLowerCase();
    if (['male', 'm', 'mr', 'shri', 'sri'].includes(normalized)) return Sex.MALE;
    if (['female', 'f', 'mrs', 'miss', 'ms', 'smt', 'kumari'].includes(normalized)) return Sex.FEMALE;
    if (['transgender', 't', 'mx'].includes(normalized)) return Sex.TRANSGENDER;
    return undefined;
  }

  private normalizeModeOfJourney(value: any): ModeOfJourney {
    const normalized = String(value || '').trim().toLowerCase();
    if (['flight', 'air', 'airline', 'air ticket', 'plane'].includes(normalized)) return ModeOfJourney.FLIGHT;
    if (['train', 'rail', 'railway', 'railway ticket'].includes(normalized)) return ModeOfJourney.TRAIN;
    if (['bus', 'coach'].includes(normalized)) return ModeOfJourney.BUS;
    if (['hotel', 'accommodation', 'stay', 'room', 'voucher'].includes(normalized)) return ModeOfJourney.HOTEL;
    if (['cab', 'car', 'taxi', 'transfer'].includes(normalized)) return ModeOfJourney.CAB;
    return Object.values(ModeOfJourney).includes(value) ? value : ModeOfJourney.OTHER;
  }

  private buildSegmentKey(segment: any): string {
    return [
      segment.modeOfJourney,
      segment.carrierCode,
      segment.serviceNumber,
      segment.depCode,
      segment.arrCode,
      segment.depAt,
      segment.arrAt,
      segment.hotelName,
      segment.checkIn,
      segment.checkOut,
    ]
      .map((value) => String(value || '').trim().toUpperCase())
      .join('|');
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

    data.bookingDate = this.normalizeDate(data.bookingDate) || data.bookingDate;
    data.totalAmount = this.normalizeAmount(data.totalAmount);
    data.modeOfJourney = data.modeOfJourney ? this.normalizeModeOfJourney(data.modeOfJourney) : data.modeOfJourney;

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

    const seenPaxNames = new Set<string>();
    data.pax = data.pax
      .map((pax: any) => ({
        ...pax,
        paxName: this.normalizePaxName(pax.paxName),
        paxType: this.normalizePaxType(pax.paxType),
        sex: this.normalizeSex(pax.sex),
        dob: this.normalizeDate(pax.dob),
      }))
      .filter((pax: any) => {
        if (!pax.paxName) return false;
        const key = pax.paxName.toUpperCase();
        if (seenPaxNames.has(key)) return false;
        seenPaxNames.add(key);
        return true;
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
          segment.modeOfJourney = this.normalizeModeOfJourney(segment.modeOfJourney);
        }
        segment.depAt = this.normalizeDate(segment.depAt);
        segment.arrAt = this.normalizeDate(segment.arrAt);
        segment.checkIn = this.normalizeDate(segment.checkIn);
        segment.checkOut = this.normalizeDate(segment.checkOut);

        if (
          segment.modeOfJourney !== ModeOfJourney.HOTEL &&
          !segment.depAt &&
          typeof segment.arrAt === 'string' &&
          /^\d{4}-\d{2}-\d{2}T00:00:00$/.test(segment.arrAt)
        ) {
          segment.depAt = segment.arrAt;
          delete segment.arrAt;
        }
      });

      const seenSegments = new Set<string>();
      itinerary.segments = itinerary.segments.filter((segment: any) => {
        const key = this.buildSegmentKey(segment);
        if (seenSegments.has(key)) return false;
        seenSegments.add(key);
        return true;
      });
      itinerary.segments.forEach((segment: any, sIndex: number) => {
        segment.seqNo = sIndex + 1;
      });
    });

    // Set default confidence if not provided
    if (!data.extractionConfidence) {
      data.extractionConfidence = 'MEDIUM';
    }

    if (data.pax.length === 0 || data.itineraries.length === 0) {
      data.extractionConfidence = data.extractionConfidence === 'HIGH' ? 'MEDIUM' : data.extractionConfidence;
      data.notes = `${data.notes || ''}\nExtraction incomplete: missing passenger or itinerary data.`.trim();
    }

    // Add schema version for tracking
    data.schemaVersion = SchemaReflectionService.getSchemaVersion();

    return data as OCRExtractedBooking;
  }

  async testConnection(): Promise<boolean> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const result = await model.generateContent('Test connection');
      return !!result.response;
    } catch (error) {
      console.error('Gemini connection test failed:', error);
      return false;
    }
  }
}
