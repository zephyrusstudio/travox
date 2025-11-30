/**
 * @swagger
 * /vendors:
 *   get:
 *     tags: [Vendors]
 *     summary: Get all vendors
 *     description: Retrieve all vendors for the authenticated user's organization
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: limit
 *         in: query
 *         required: false
 *         description: Maximum number of vendors to return
 *         schema:
 *           type: integer
 *           example: 50
 *       - $ref: '#/components/parameters/unmask'
 *     responses:
 *       200:
 *         description: Vendors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Vendor'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     tags: [Vendors]
 *     summary: Create a new vendor
 *     description: Create a new vendor in the authenticated user's organization
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/unmask'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateVendor'
 *     responses:
 *       201:
 *         description: Vendor created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Vendor'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /vendors/report:
 *   get:
 *     tags: [Vendors]
 *     summary: Get vendors expense payments report
 *     description: |
 *       Retrieve a report of all vendors with their expense payments within a specified date interval.
 *       The interval is based on payment date. Only expense-type payments are included.
 *       Results are cached in Redis for 5 minutes for efficiency.
 *       Results are sorted by total paid amount in descending order.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: interval
 *         in: query
 *         required: true
 *         description: |
 *           Date interval for the report in format "startDate,endDate".
 *           Dates should be in ISO format or URL-encoded datetime strings.
 *         schema:
 *           type: string
 *           example: "2025-12-01 00:00,2025-12-31 23:59"
 *     responses:
 *       200:
 *         description: Report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       vendor:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "vendor_123"
 *                           name:
 *                             type: string
 *                             example: "Thai Airways"
 *                           serviceType:
 *                             type: string
 *                             example: "Airline"
 *                           phone:
 *                             type: string
 *                             example: "9876543210"
 *                           email:
 *                             type: string
 *                             example: "bookings@thai.com"
 *                       payments:
 *                         type: array
 *                         description: List of expense payments made to this vendor
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               example: "pay_789"
 *                             bookingId:
 *                               type: string
 *                               example: "book_456"
 *                             amount:
 *                               type: number
 *                               example: 35000
 *                             paymentMode:
 *                               type: string
 *                               example: "BANK_TRANSFER"
 *                             description:
 *                               type: string
 *                               example: "Flight booking payment"
 *                             createdAt:
 *                               type: string
 *                               format: date-time
 *                       totalPaid:
 *                         type: number
 *                         description: Total expense amount paid to this vendor
 *                         example: 35000
 *                       paymentCount:
 *                         type: integer
 *                         description: Number of expense payments made to this vendor
 *                         example: 1
 *                 count:
 *                   type: integer
 *                   description: Total number of vendors in the report
 *                   example: 3
 *                 interval:
 *                   type: object
 *                   properties:
 *                     start:
 *                       type: string
 *                       format: date-time
 *                     end:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - invalid or missing interval parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /vendors/{id}:
 *   get:
 *     tags: [Vendors]
 *     summary: Get vendor by ID
 *     description: Retrieve a specific vendor by their ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Vendor ID
 *         schema:
 *           type: string
 *           example: "vendor_123456"
 *       - $ref: '#/components/parameters/unmask'
 *     responses:
 *       200:
 *         description: Vendor retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Vendor'
 *       404:
 *         description: Vendor not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     tags: [Vendors]
 *     summary: Update vendor
 *     description: Update an existing vendor's information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Vendor ID
 *         schema:
 *           type: string
 *           example: "vendor_123456"
 *       - $ref: '#/components/parameters/unmask'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateVendor'
 *     responses:
 *       200:
 *         description: Vendor updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Vendor'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Vendor not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     tags: [Vendors]
 *     summary: Delete vendor
 *     description: Soft delete a vendor (mark as deleted but keep in database)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Vendor ID
 *         schema:
 *           type: string
 *           example: "vendor_123456"
 *     responses:
 *       200:
 *         description: Vendor deleted successfully
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
 *                         message:
 *                           type: string
 *                           example: "Vendor deleted successfully"
 *       404:
 *         description: Vendor not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /vendors/search:
 *   get:
 *     tags: [Vendors]
 *     summary: Search vendors
 *     description: Search vendors by name or service type
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: q
 *         in: query
 *         required: true
 *         description: Search query string
 *         schema:
 *           type: string
 *           example: "travel"
 *       - name: serviceType
 *         in: query
 *         required: false
 *         description: Filter by service type
 *         schema:
 *           type: string
 *           enum: ['FLIGHT', 'HOTEL', 'TRANSPORT', 'VISA', 'INSURANCE', 'MARKETING', 'OFFICE', 'OTHER']
 *           example: "FLIGHT"
 *       - name: limit
 *         in: query
 *         required: false
 *         description: Maximum number of results to return
 *         schema:
 *           type: integer
 *           example: 10
 *       - $ref: '#/components/parameters/unmask'
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Vendor'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /vendors/{id}/stats:
 *   get:
 *     tags: [Vendors]
 *     summary: Get vendor statistics
 *     description: Get statistical information about a vendor's bookings and expenses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Vendor ID
 *         schema:
 *           type: string
 *           example: "vendor_123456"
 *     responses:
 *       200:
 *         description: Vendor statistics retrieved successfully
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
 *                         totalExpense:
 *                           type: number
 *                           example: 150000
 *                         totalBookings:
 *                           type: number
 *                           example: 25
 *                         averageExpense:
 *                           type: number
 *                           example: 6000
 *       404:
 *         description: Vendor not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */