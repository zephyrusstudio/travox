/**
 * @swagger
 * /payments:
 *   get:
 *     tags: [Payments]
 *     summary: Get all payments
 *     description: Retrieve payments for the authenticated user's organization
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: limit
 *         in: query
 *         required: false
 *         description: Maximum number of payments to return
 *         schema:
 *           type: integer
 *           example: 50
 *       - name: offset
 *         in: query
 *         required: false
 *         description: Number of payments to skip (for pagination)
 *         schema:
 *           type: integer
 *           example: 0
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
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
 *                         $ref: '#/components/schemas/Payment'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /payments/{id}:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment by ID
 *     description: Retrieve a specific payment by its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Payment ID
 *         schema:
 *           type: string
 *           example: "payment_123456"
 *     responses:
 *       200:
 *         description: Payment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Payment'
 *       404:
 *         description: Payment not found
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
 * /payments/receivable:
 *   post:
 *     tags: [Payments]
 *     summary: Create receivable payment
 *     description: Record a payment received from a customer for a booking
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *               - amount
 *               - currency
 *               - paymentMode
 *               - customerId
 *               - fromAccountId
 *             properties:
 *               bookingId:
 *                 type: string
 *                 example: "booking_123456"
 *               amount:
 *                 type: number
 *                 example: 25000
 *               currency:
 *                 type: string
 *                 example: "INR"
 *               paymentMode:
 *                 type: string
 *                 enum: ['CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'CHEQUE', 'OTHER']
 *                 example: "UPI"
 *               customerId:
 *                 type: string
 *                 example: "cust_123456"
 *               fromAccountId:
 *                 type: string
 *                 example: "acc_123"
 *               toAccountId:
 *                 type: string
 *                 example: "acc_456"
 *               category:
 *                 type: string
 *                 example: "booking_payment"
 *               notes:
 *                 type: string
 *                 example: "Advance payment for Dubai trip"
 *               receiptNo:
 *                 type: string
 *                 example: "RCP001"
 *     responses:
 *       201:
 *         description: Receivable payment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /payments/expense:
 *   post:
 *     tags: [Payments]
 *     summary: Create expense payment
 *     description: Record a payment made to a vendor for expenses
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - currency
 *               - paymentMode
 *               - toAccountId
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 15000
 *               currency:
 *                 type: string
 *                 example: "INR"
 *               paymentMode:
 *                 type: string
 *                 enum: ['CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'CHEQUE', 'OTHER']
 *                 example: "BANK_TRANSFER"
 *               toAccountId:
 *                 type: string
 *                 example: "acc_vendor_123"
 *               bookingId:
 *                 type: string
 *                 example: "booking_123456"
 *                 description: "Optional booking ID to associate the expense with a specific booking"
 *               vendorId:
 *                 type: string
 *                 example: "vendor_123456"
 *               fromAccountId:
 *                 type: string
 *                 example: "acc_company"
 *               category:
 *                 type: string
 *                 example: "vendor_payment"
 *               notes:
 *                 type: string
 *                 example: "Flight booking payment to vendor"
 *               receiptNo:
 *                 type: string
 *                 example: "EXP001"
 *     responses:
 *       201:
 *         description: Expense payment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */