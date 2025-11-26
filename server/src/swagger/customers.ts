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