/**
 * @swagger
 * /customers:
 *   get:
 *     tags: [Customers]
 *     summary: Get all customers
 *     description: Retrieve all active customers for the authenticated user's organization
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/unmask'
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
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
 *                         $ref: '#/components/schemas/Customer'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     tags: [Customers]
 *     summary: Create a new customer
 *     description: Create a new customer in the authenticated user's organization
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/unmask'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCustomer'
 *     responses:
 *       201:
 *         description: Customer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /customers/report:
 *   get:
 *     tags: [Customers]
 *     summary: Get customers bookings report
 *     description: |
 *       Retrieve a report of customers with their bookings within a specified date interval.
 *       The interval is based on booking date. Results are cached in Redis for 5 minutes for efficiency.
 *       Use the `pending` parameter to filter for only bookings with pending payments.
 *       When pending=true, results are sorted by total due amount descending.
 *       When pending=false (default), results are sorted by total amount descending.
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
 *       - name: pending
 *         in: query
 *         required: false
 *         description: |
 *           If true, only include bookings with pending payments (dueAmount > 0).
 *           If false or omitted, all bookings are included.
 *         schema:
 *           type: boolean
 *           default: false
 *           example: true
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
 *                       customer:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "cust_123"
 *                           name:
 *                             type: string
 *                             example: "John Doe"
 *                           phone:
 *                             type: string
 *                             example: "9876543210"
 *                           email:
 *                             type: string
 *                             example: "john@example.com"
 *                       bookings:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               example: "book_456"
 *                             packageName:
 *                               type: string
 *                               example: "Thailand Tour"
 *                             primaryPaxName:
 *                               type: string
 *                               example: "John Doe"
 *                             bookingDate:
 *                               type: string
 *                               format: date-time
 *                             totalAmount:
 *                               type: number
 *                               example: 50000
 *                             paidAmount:
 *                               type: number
 *                               example: 25000
 *                             dueAmount:
 *                               type: number
 *                               example: 25000
 *                             status:
 *                               type: string
 *                               example: "Confirmed"
 *                             travelStartAt:
 *                               type: string
 *                               format: date-time
 *                             travelEndAt:
 *                               type: string
 *                               format: date-time
 *                       totalAmount:
 *                         type: number
 *                         description: Total amount across all bookings
 *                         example: 50000
 *                       totalPaid:
 *                         type: number
 *                         description: Total paid amount across all bookings
 *                         example: 25000
 *                       totalDue:
 *                         type: number
 *                         description: Total pending amount across all bookings
 *                         example: 25000
 *                       bookingCount:
 *                         type: integer
 *                         description: Number of bookings
 *                         example: 1
 *                 count:
 *                   type: integer
 *                   description: Total number of customers in the report
 *                   example: 5
 *                 pendingOnly:
 *                   type: boolean
 *                   description: Whether the report is filtered for pending payments only
 *                   example: false
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
 * /customers/{id}:
 *   get:
 *     tags: [Customers]
 *     summary: Get customer by ID
 *     description: Retrieve a specific customer by their ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Customer ID
 *         schema:
 *           type: string
 *           example: "cust_123456"
 *       - $ref: '#/components/parameters/unmask'
 *     responses:
 *       200:
 *         description: Customer retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Customer'
 *       404:
 *         description: Customer not found
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
 *     tags: [Customers]
 *     summary: Update customer
 *     description: Update an existing customer's information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Customer ID
 *         schema:
 *           type: string
 *           example: "cust_123456"
 *       - $ref: '#/components/parameters/unmask'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCustomer'
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     tags: [Customers]
 *     summary: Soft delete customer
 *     description: Soft delete a customer (mark as deleted but keep in database)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Customer ID
 *         schema:
 *           type: string
 *           example: "cust_123456"
 *     responses:
 *       200:
 *         description: Customer deleted successfully
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
 *                           example: "Customer deleted successfully"
 *       404:
 *         description: Customer not found
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
 * /customers/search:
 *   get:
 *     tags: [Customers]
 *     summary: Search customers
 *     description: Search customers by name, email, phone, or GSTIN. Supports partial matching. At least one search parameter is required. Returns an array of matching customers.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: q
 *         in: query
 *         required: false
 *         description: General search query (searches across name, email, phone, and GSTIN)
 *         schema:
 *           type: string
 *           example: "john"
 *       - name: name
 *         in: query
 *         required: false
 *         description: Search by customer name (partial match supported)
 *         schema:
 *           type: string
 *           example: "john doe"
 *       - name: email
 *         in: query
 *         required: false
 *         description: Search by email address (partial match supported)
 *         schema:
 *           type: string
 *           example: "john@example"
 *       - name: phone
 *         in: query
 *         required: false
 *         description: Search by phone number (partial match supported)
 *         schema:
 *           type: string
 *           example: "9876"
 *       - name: gstin
 *         in: query
 *         required: false
 *         description: Search by GST identification number (partial match supported)
 *         schema:
 *           type: string
 *           example: "29ABCDE"
 *       - $ref: '#/components/parameters/unmask'
 *     responses:
 *       200:
 *         description: Search results - returns array of matching customers
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
 *                         $ref: '#/components/schemas/Customer'
 *             examples:
 *               multipleResults:
 *                 summary: Multiple customers found
 *                 value:
 *                   status: success
 *                   data:
 *                     - id: "cust_123"
 *                       name: "John Doe"
 *                       email: "john@example.com"
 *                       phone: "9876543210"
 *                     - id: "cust_456"
 *                       name: "Johnny Smith"
 *                       email: "johnny@example.com"
 *                       phone: "9876543211"
 *               singleResult:
 *                 summary: Exact match found
 *                 value:
 *                   status: success
 *                   data:
 *                     - id: "cust_123"
 *                       name: "John Doe"
 *                       email: "john.doe@example.com"
 *                       phone: "9876543210"
 *                       gstin: "29ABCDE1234F1Z5"
 *       400:
 *         description: Bad request - at least one search parameter required
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