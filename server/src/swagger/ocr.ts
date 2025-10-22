/**
 * @swagger
 * /scan-upload:
 *   post:
 *     tags: [OCR]
 *     summary: Extract booking data from uploaded file
 *     description: Upload a travel document (ticket, voucher, booking confirmation) and extract structured booking data using Gemini AI OCR
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Travel document file (JPEG, PNG, GIF, WebP, or PDF)
 *     parameters:
 *       - name: format
 *         in: query
 *         required: false
 *         description: Convert extracted data to booking format
 *         schema:
 *           type: boolean
 *           default: false
 *           example: true
 *     responses:
 *       200:
 *         description: OCR extraction completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         fileInfo:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                               example: "flight_ticket.pdf"
 *                             mimeType:
 *                               type: string
 *                               example: "application/pdf"
 *                             size:
 *                               type: integer
 *                               example: 1048576
 *                         extractedData:
 *                           $ref: '#/components/schemas/OCRExtractedBooking'
 *                         booking:
 *                           type: object
 *                           description: Converted booking data (only if format=true)
 *                           properties:
 *                             bookingData:
 *                               $ref: '#/components/schemas/Booking'
 *                             vendorInfo:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                   example: "Travel Agency XYZ"
 *                                 contact:
 *                                   type: string
 *                                   example: "+91 9876543210"
 *                                 email:
 *                                   type: string
 *                                   example: "info@travelagency.com"
 *                             extractionMetadata:
 *                               type: object
 *                               properties:
 *                                 confidence:
 *                                   type: string
 *                                   enum: ['HIGH', 'MEDIUM', 'LOW']
 *                                   example: 'HIGH'
 *                                 extractedFields:
 *                                   type: array
 *                                   items:
 *                                     type: string
 *                                   example: ['paxName', 'pnrNo', 'flightNumber', 'departureDate']
 *                                 notes:
 *                                   type: string
 *                                   example: "All passenger and flight details extracted successfully"
 *       400:
 *         description: Bad request - invalid file or parameters
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Error'
 *                 - type: object
 *                   properties:
 *                     supportedTypes:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
 *       500:
 *         description: Server error - OCR extraction failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /files/{fileId}/scan:
 *   post:
 *     tags: [OCR]
 *     summary: Extract booking data from existing file
 *     description: Extract structured booking data from a previously uploaded file using Gemini AI OCR
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: fileId
 *         in: path
 *         required: true
 *         description: ID of the file to process
 *         schema:
 *           type: string
 *           example: "file_123456"
 *       - name: format
 *         in: query
 *         required: false
 *         description: Convert extracted data to booking format
 *         schema:
 *           type: boolean
 *           default: false
 *           example: true
 *     responses:
 *       200:
 *         description: OCR extraction completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         fileInfo:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               example: "file_123456"
 *                             name:
 *                               type: string
 *                               example: "hotel_voucher.pdf"
 *                             mimeType:
 *                               type: string
 *                               example: "application/pdf"
 *                             size:
 *                               type: integer
 *                               example: 2097152
 *                         extractedData:
 *                           $ref: '#/components/schemas/OCRExtractedBooking'
 *       404:
 *         description: File not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       501:
 *         description: Not implemented - file content access not available
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Error'
 *                 - type: object
 *                   properties:
 *                     supportedEndpoint:
 *                       type: string
 *                       example: "/scan-upload"
 *       500:
 *         description: Server error - OCR extraction failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /scan:
 *   get:
 *     tags: [OCR]
 *     summary: Test Gemini AI connection
 *     description: Test the connection to Google's Gemini AI service for OCR functionality
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Connection test completed
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         connected:
 *                           type: boolean
 *                           example: true
 *                           description: Whether connection to Gemini AI is successful
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-15T10:30:00.000Z"
 *                           description: Timestamp of the connection test
 *       500:
 *         description: Connection test failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /schema:
 *   get:
 *     tags: [OCR]
 *     summary: Get current OCR schema information
 *     description: Retrieve the current OCR extraction schema that automatically reflects domain model changes. This is useful for understanding what data fields the OCR system can extract.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Schema information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         schemaVersion:
 *                           type: string
 *                           example: "v1a2b3c4d"
 *                           description: Current schema version hash
 *                         dynamicGeneration:
 *                           type: boolean
 *                           example: true
 *                           description: Whether schema is dynamically generated from domain models
 *                         lastUpdated:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-15T10:30:00.000Z"
 *                           description: When the schema was last generated
 *                         description:
 *                           type: string
 *                           example: "This schema is automatically generated based on current domain models"
 *                           description: Schema description
 *                         schema:
 *                           type: object
 *                           description: Complete OCR extraction schema based on current domain models
 *                           properties:
 *                             packageName:
 *                               type: string
 *                               example: "string (optional) - Name of travel package or booking"
 *                             pnrNo:
 *                               type: string
 *                               example: "string (optional) - PNR/booking reference number"
 *                             bookingDate:
 *                               type: string
 *                               example: "string (optional) - ISO date string YYYY-MM-DD"
 *                             totalAmount:
 *                               type: string
 *                               example: "number (optional) - Total booking amount"
 *                             currency:
 *                               type: string
 *                               example: "string (optional) - Currency code (INR, USD, etc.)"
 *                             modeOfJourney:
 *                               type: string
 *                               example: "string (optional) - Primary travel mode"
 *                             pax:
 *                               type: array
 *                               description: Passenger information structure
 *                             itineraries:
 *                               type: array
 *                               description: Itinerary and segment structure
 *                             vendorInfo:
 *                               type: object
 *                               description: Vendor/agency information structure
 *       500:
 *         description: Failed to retrieve schema information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */