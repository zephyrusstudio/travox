import { Request, Response } from 'express';
import { container } from '../../config/container';
import { GeminiOCRService, OCRExtractedBooking } from '../../services/GeminiOCRService';
import { SchemaReflectionService } from '../../services/SchemaReflectionService';
import { GetFiles } from '../../application/useCases/file/GetFiles';
import { DownloadFile } from '../../application/useCases/file/DownloadFile';
import { Booking } from '../../domain/Booking';
import { BookingPax } from '../../domain/BookingPax';
import { BookingItinerary } from '../../domain/BookingItinerary';
import { BookingSegment } from '../../domain/BookingSegment';
import { ModeOfJourney, PAXType, BookingStatus } from '../../models/FirestoreTypes';
import logger from '../../config/logger';

export class OCRController {
  private geminiService: GeminiOCRService;

  constructor() {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (geminiApiKey) {
      this.geminiService = new GeminiOCRService(geminiApiKey);
    } else {
      // Initialize with null service - will show proper error messages when endpoints are called
      this.geminiService = null as any;
      console.warn('⚠️  GEMINI_API_KEY not found. OCR endpoints will return configuration errors.');
    }
  }

  /**
   * Unified extract method that handles both file upload and file ID cases
   */
  extract = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check if Gemini service is configured
      if (!this.geminiService) {
        res.status(503).json({
          status: 'error',
          message: 'OCR service not configured. Please set GEMINI_API_KEY environment variable.',
          documentation: 'See OCR_SETUP.md for configuration instructions'
        });
        return;
      }

      // Check if a file was uploaded (binary data)
      if (req.file) {
        await this.extractFromUpload(req, res);
        return;
      }

      // Check if fileId was provided as query parameter
      const fileId = req.query.fileId as string;
      if (fileId) {
        await this.extractFromFileStore(req, res, fileId);
        return;
      }

      // Neither file upload nor fileId provided
      res.status(400).json({
        status: 'error',
        message: 'Either upload a file or provide a fileId query parameter',
        usage: {
          fileUpload: 'POST /scan with multipart/form-data file',
          fileId: 'POST /scan?fileId=YOUR_FILE_ID'
        }
      });

    } catch (error) {
      logger.error({ err: error }, 'OCR extraction failed');
      
      res.status(500).json({
        status: 'error',
        message: 'OCR extraction failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  private wantsFormattedBooking(req: Request): boolean {
    const raw = req.query.format ?? req.body?.format;
    return raw === true || raw === 'true' || raw === '1';
  }

  /**
   * Extract booking data from Google Drive file by ID
   */
  private extractFromFileStore = async (req: Request, res: Response, fileId: string): Promise<void> => {
    try {
      if (!fileId) {
        res.status(400).json({
          status: 'error',
          message: 'File ID is required'
        });
        return;
      }

      // Get user info from request (assuming it's in req.user from auth middleware)
      const user = (req as any).user;
      if (!user || !user.orgId) {
        res.status(401).json({
          status: 'error',
          message: 'User authentication required'
        });
        return;
      }

      logger.info(`Starting OCR extraction for file: ${fileId}`);
      
      // Use file use cases directly
      const getFilesUseCase = container.resolve(GetFiles);
      const downloadFileUseCase = container.resolve(DownloadFile);
      
      let fileInfo;
      let downloadResult;
      
      try {
        // Get file metadata
        fileInfo = await getFilesUseCase.getById(fileId, user.orgId);
        if (!fileInfo) {
          res.status(404).json({
            status: 'error',
            message: 'File not found'
          });
          return;
        }

        // Download file content
        downloadResult = await downloadFileUseCase.execute(fileId, user.orgId);

      } catch (error) {
        logger.error({ err: error, fileId }, 'Failed to fetch file');
        res.status(404).json({
          status: 'error',
          message: error instanceof Error ? error.message : 'File not found or inaccessible'
        });
        return;
      }

      // Check if file type is supported for OCR
      const supportedMimeTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf'
      ];
      
      if (!supportedMimeTypes.includes(downloadResult.mimeType)) {
        res.status(400).json({
          status: 'error',
          message: 'Unsupported file type for OCR. Supported types: JPEG, PNG, GIF, WebP, PDF',
          supportedTypes: supportedMimeTypes,
          actualType: downloadResult.mimeType
        });
        return;
      }

      // Extract booking data using Gemini
      logger.info(`Processing OCR for file: ${downloadResult.fileName} (${downloadResult.mimeType})`);
      
      const extractedData = await this.geminiService.extractBookingData(
        downloadResult.fileBuffer,
        downloadResult.mimeType,
        downloadResult.fileName
      );

      logger.info({
        fileName: downloadResult.fileName,
        confidence: extractedData.extractionConfidence,
        extractedFields: extractedData.extractedFields,
        paxCount: extractedData.pax.length,
        itineraryCount: extractedData.itineraries.length
      }, 'OCR extraction completed for file');

      // Optionally convert to booking format
      const format = this.wantsFormattedBooking(req);
      
      let bookingData = null;
      if (format) {
        bookingData = await this.convertToBooking(extractedData, req);
      }

      res.status(200).json({
        status: 'success',
        message: 'OCR extraction completed successfully',
        data: format ? {
          fileInfo: {
            id: fileId,
            name: downloadResult.fileName,
            mimeType: downloadResult.mimeType,
            size: fileInfo.size
          },
          booking: bookingData
        } : {
          fileInfo: {
            id: fileId,
            name: downloadResult.fileName,
            mimeType: downloadResult.mimeType,
            size: fileInfo.size
          },
          extractedData,
          ...(bookingData && { booking: bookingData })
        }
      });

    } catch (error) {
      logger.error({ err: error }, 'OCR extraction from file failed');
      
      res.status(500).json({
        status: 'error',
        message: 'OCR extraction failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Extract booking data from direct file upload
   */
  extractFromUpload = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check if Gemini service is configured
      if (!this.geminiService) {
        res.status(503).json({
          status: 'error',
          message: 'OCR service not configured. Please set GEMINI_API_KEY environment variable.',
          documentation: 'See OCR_SETUP.md for configuration instructions'
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          status: 'error',
          message: 'No file uploaded'
        });
        return;
      }

      const file = req.file;
      
      // Check if file type is supported for OCR
      const supportedMimeTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf'
      ];
      
      if (!supportedMimeTypes.includes(file.mimetype)) {
        res.status(400).json({
          status: 'error',
          message: 'Unsupported file type. Supported types: JPEG, PNG, GIF, WebP, PDF',
          supportedTypes: supportedMimeTypes
        });
        return;
      }

      // Extract booking data using Gemini
      logger.info(`Starting OCR extraction for uploaded file: ${file.originalname} (${file.mimetype})`);
      
      const extractedData = await this.geminiService.extractBookingData(
        file.buffer,
        file.mimetype,
        file.originalname
      );

      logger.info({
        fileName: file.originalname,
        confidence: extractedData.extractionConfidence,
        extractedFields: extractedData.extractedFields,
        paxCount: extractedData.pax.length,
        itineraryCount: extractedData.itineraries.length
      }, 'OCR extraction completed for uploaded file');

      // Optionally convert to booking format
      const format = this.wantsFormattedBooking(req);
      
      let bookingData = null;
      if (format) {
        bookingData = await this.convertToBooking(extractedData, req);
      }

      res.status(200).json({
        status: 'success',
        message: 'OCR extraction completed successfully',
        data: format ? {
          fileInfo: {
            name: file.originalname,
            mimeType: file.mimetype,
            size: file.size
          },
          booking: bookingData
        } : {
          fileInfo: {
            name: file.originalname,
            mimeType: file.mimetype,
            size: file.size
          },
          extractedData,
          ...(bookingData && { booking: bookingData })
        }
      });

    } catch (error) {
      logger.error({ err: error }, 'OCR extraction from upload failed');
      
      res.status(500).json({
        status: 'error',
        message: 'OCR extraction failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Test Gemini connection
   */
  health = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check if Gemini service is configured
      if (!this.geminiService) {
        res.status(503).json({
          status: 'error',
          message: 'OCR service not configured. Please set GEMINI_API_KEY environment variable.',
          documentation: 'See OCR_SETUP.md for configuration instructions',
          data: {
            connected: false,
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      const isConnected = await this.geminiService.testConnection();
      
      res.status(200).json({
        status: 'success',
        message: 'Gemini connection test completed',
        data: {
          connected: isConnected,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Gemini connection test failed');
      
      res.status(500).json({
        status: 'error',
        message: 'Gemini connection test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get current OCR schema information and version
   * This endpoint shows the schema that OCR extraction is using, which automatically
   * adapts when the domain models change
   */
  getSchemaInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const schema = SchemaReflectionService.generateOCRSchema();
      const version = SchemaReflectionService.getSchemaVersion();
      
      res.status(200).json({
        status: 'success',
        message: 'OCR schema information retrieved successfully',
        data: {
          schemaVersion: version,
          schema: schema,
          dynamicGeneration: true,
          lastUpdated: new Date().toISOString(),
          description: 'This schema is automatically generated based on current domain models'
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to get schema info');
      
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve schema information',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Convert extracted OCR data to booking domain model
   */
  private async convertToBooking(extractedData: OCRExtractedBooking, req: Request): Promise<any> {
    try {
      // Get user info from request (assuming it's in req.user from auth middleware)
      const user = (req as any).user;
      if (!user) {
        throw new Error('User information not available for booking creation');
      }

      // Create PAX objects
      const paxList: BookingPax[] = extractedData.pax.map(paxData => 
        BookingPax.create(
          user.orgId,
          '', // Will be set when booking is created
          paxData.paxName,
          paxData.paxType || PAXType.ADT,
          {
            sex: paxData.sex,
            passportNo: paxData.passportNo,
            dob: paxData.dob ? new Date(paxData.dob) : undefined
          }
        )
      );

      // Create itineraries and segments
      const itineraries: BookingItinerary[] = extractedData.itineraries.map((itinData, index) => {
        const segments: BookingSegment[] = itinData.segments.map((segData, segIndex) => 
          BookingSegment.create(
            user.orgId,
            '', // Will be set when itinerary is created
            segData.seqNo || segIndex + 1,
            segData.modeOfJourney || ModeOfJourney.OTHER,
            {
              carrierCode: segData.carrierCode,
              serviceNumber: segData.serviceNumber,
              depCode: segData.depCode,
              arrCode: segData.arrCode,
              depAt: segData.depAt ? new Date(segData.depAt) : undefined,
              arrAt: segData.arrAt ? new Date(segData.arrAt) : undefined,
              classCode: segData.classCode,
              baggage: segData.baggage,
              hotelName: segData.hotelName,
              hotelAddress: segData.hotelAddress,
              checkIn: segData.checkIn ? new Date(segData.checkIn) : undefined,
              checkOut: segData.checkOut ? new Date(segData.checkOut) : undefined,
              roomType: segData.roomType,
              mealPlan: segData.mealPlan,
              operatorName: segData.operatorName,
              boardingPoint: segData.boardingPoint,
              dropPoint: segData.dropPoint,
              misc: segData.misc
            }
          )
        );

        return BookingItinerary.create(
          user.orgId,
          '', // Will be set when booking is created
          itinData.name || `Itinerary ${index + 1}`,
          itinData.seqNo || index + 1,
          segments
        );
      });

      // Return sanitized data that preserves original extraction while ensuring type safety
      // Remove metadata fields from the main object to avoid duplication
      const { extractionConfidence, extractedFields, notes, schemaVersion, ...cleanedData } = extractedData;
      
      return {
        ...cleanedData,
        // Add booking status for domain model compatibility
        status: BookingStatus.DRAFT,
        // Ensure pax data has proper defaults while preserving original values
        pax: extractedData.pax.map(paxData => ({
          ...paxData,
          paxType: paxData.paxType || PAXType.ADT
        })),
        // Ensure segments have proper defaults while preserving original values
        itineraries: extractedData.itineraries.map(itinData => ({
          ...itinData,
          segments: itinData.segments.map(segData => ({
            ...segData,
            modeOfJourney: segData.modeOfJourney || ModeOfJourney.OTHER
          }))
        })),
        // Move metadata to separate section for clarity
        extractionMetadata: {
          confidence: extractionConfidence,
          extractedFields: extractedFields, // This preserves the original hierarchical structure
          notes: notes,
          schemaVersion: schemaVersion
        }
      };

    } catch (error) {
      logger.error({ err: error }, 'Failed to convert OCR data to booking');
      throw error;
    }
  }
}
