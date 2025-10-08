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