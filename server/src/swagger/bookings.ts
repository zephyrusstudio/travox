/**
 * @swagger
 * /bookings:
 *   get:
 *     tags: [Bookings]
 *     summary: Get all bookings
 *     description: Retrieve bookings with optional filtering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: customerId
 *         in: query
 *         required: false
 *         description: Filter by customer ID
 *         schema:
 *           type: string
 *           example: "cust_123456"
 *       - name: status
 *         in: query
 *         required: false
 *         description: Filter by booking status
 *         schema:
 *           type: string
 *           enum: ['DRAFT', 'CONFIRMED', 'CANCELLED', 'COMPLETED']
 *           example: "CONFIRMED"
 *       - name: startDate
 *         in: query
 *         required: false
 *         description: Filter by booking date (from)
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-01"
 *       - name: endDate
 *         in: query
 *         required: false
 *         description: Filter by booking date (to)
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-12-31"
 *       - name: pnr
 *         in: query
 *         required: false
 *         description: Filter by PNR number
 *         schema:
 *           type: string
 *           example: "ABC123"
 *       - name: limit
 *         in: query
 *         required: false
 *         description: Maximum number of bookings to return
 *         schema:
 *           type: integer
 *           example: 50
 *       - $ref: '#/components/parameters/unmask'
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
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
 *                         $ref: '#/components/schemas/Booking'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     tags: [Bookings]
 *     summary: Create a new booking
 *     description: Create a new booking in the authenticated user's organization
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/unmask'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - totalAmount
 *               - currency
 *             properties:
 *               customerId:
 *                 type: string
 *                 example: "cust_123456"
 *               totalAmount:
 *                 type: number
 *                 example: 75000
 *               currency:
 *                 type: string
 *                 example: "INR"
 *               packageName:
 *                 type: string
 *                 example: "Dubai Holiday Package"
 *               pnrNo:
 *                 type: string
 *                 example: "ABC123"
 *               modeOfJourney:
 *                 type: string
 *                 example: "FLIGHT"
 *               advanceAmount:
 *                 type: number
 *                 example: 25000
 *               status:
 *                 type: string
 *                 enum: ['DRAFT', 'CONFIRMED', 'CANCELLED', 'COMPLETED']
 *                 example: "CONFIRMED"
 *               bookingDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-15T10:30:00Z"
 *               pax:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     paxName:
 *                       type: string
 *                       example: "John Doe"
 *                     paxType:
 *                       type: string
 *                       enum: ['ADULT', 'CHILD', 'INFANT']
 *                       example: "ADULT"
 *                     passportNo:
 *                       type: string
 *                       example: "A1234567"
 *                     dob:
 *                       type: string
 *                       format: date
 *                       example: "1990-01-15"
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /bookings/{id}:
 *   get:
 *     tags: [Bookings]
 *     summary: Get booking by ID
 *     description: Retrieve a specific booking by its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Booking ID
 *         schema:
 *           type: string
 *           example: "booking_123456"
 *       - $ref: '#/components/parameters/unmask'
 *     responses:
 *       200:
 *         description: Booking retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Booking'
 *       404:
 *         description: Booking not found
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
 *     tags: [Bookings]
 *     summary: Update booking
 *     description: Update an existing booking's information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Booking ID
 *         schema:
 *           type: string
 *           example: "booking_123456"
 *       - $ref: '#/components/parameters/unmask'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               totalAmount:
 *                 type: number
 *                 example: 80000
 *               packageName:
 *                 type: string
 *                 example: "Updated Dubai Package"
 *               status:
 *                 type: string
 *                 enum: ['DRAFT', 'CONFIRMED', 'CANCELLED', 'COMPLETED']
 *                 example: "CONFIRMED"
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Booking not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /bookings/customer/{customerId}:
 *   get:
 *     tags: [Bookings]
 *     summary: Get bookings by customer ID
 *     description: Retrieve all bookings for a specific customer
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: customerId
 *         in: path
 *         required: true
 *         description: Customer ID
 *         schema:
 *           type: string
 *           example: "cust_123456"
 *       - $ref: '#/components/parameters/unmask'
 *     responses:
 *       200:
 *         description: Customer bookings retrieved successfully
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
 *                         $ref: '#/components/schemas/Booking'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /bookings/upcoming:
 *   get:
 *     tags: [Bookings]
 *     summary: Get upcoming bookings
 *     description: Retrieve bookings with departure dates in the future
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: days
 *         in: query
 *         required: false
 *         description: Number of days ahead to look for upcoming bookings
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 30
 *           example: 7
 *       - name: limit
 *         in: query
 *         required: false
 *         description: Maximum number of bookings to return
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *           example: 10
 *       - name: unmask
 *         in: query
 *         required: false
 *         description: Show unmasked sensitive data
 *         schema:
 *           type: boolean
 *           default: false
 *           example: true
 *     responses:
 *       200:
 *         description: List of upcoming bookings
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
 *                         $ref: '#/components/schemas/Booking'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /bookings/overdue:
 *   get:
 *     tags: [Bookings]
 *     summary: Get overdue bookings
 *     description: Retrieve bookings that are overdue for completion or payment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: type
 *         in: query
 *         required: false
 *         description: Type of overdue bookings to fetch
 *         schema:
 *           type: string
 *           enum: ['payment', 'completion', 'all']
 *           default: 'all'
 *           example: 'payment'
 *       - name: limit
 *         in: query
 *         required: false
 *         description: Maximum number of bookings to return
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *           example: 10
 *       - name: unmask
 *         in: query
 *         required: false
 *         description: Show unmasked sensitive data
 *         schema:
 *           type: boolean
 *           default: false
 *           example: true
 *     responses:
 *       200:
 *         description: List of overdue bookings
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
 *                         $ref: '#/components/schemas/Booking'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /bookings/revenue-stats:
 *   get:
 *     tags: [Bookings]
 *     summary: Get booking revenue statistics
 *     description: Retrieve revenue statistics from bookings for reporting and analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: period
 *         in: query
 *         required: false
 *         description: Time period for revenue statistics
 *         schema:
 *           type: string
 *           enum: ['today', 'week', 'month', 'quarter', 'year']
 *           default: 'month'
 *           example: 'month'
 *       - name: startDate
 *         in: query
 *         required: false
 *         description: Custom start date for revenue period
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-01"
 *       - name: endDate
 *         in: query
 *         required: false
 *         description: Custom end date for revenue period
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-12-31"
 *       - name: groupBy
 *         in: query
 *         required: false
 *         description: Group revenue statistics by time unit
 *         schema:
 *           type: string
 *           enum: ['day', 'week', 'month']
 *           default: 'day'
 *           example: 'day'
 *     responses:
 *       200:
 *         description: Revenue statistics
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
 *                         totalRevenue:
 *                           type: number
 *                           example: 150000.50
 *                         totalBookings:
 *                           type: integer
 *                           example: 45
 *                         averageBookingValue:
 *                           type: number
 *                           example: 3333.34
 *                         revenueByPeriod:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               period:
 *                                 type: string
 *                                 example: "2024-01-15"
 *                               revenue:
 *                                 type: number
 *                                 example: 5000.00
 *                               bookingCount:
 *                                 type: integer
 *                                 example: 3
 *                         topDestinations:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               destination:
 *                                 type: string
 *                                 example: "Mumbai"
 *                               revenue:
 *                                 type: number
 *                                 example: 25000.00
 *                               bookingCount:
 *                                 type: integer
 *                                 example: 8
 *       400:
 *         description: Bad request - invalid parameters
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