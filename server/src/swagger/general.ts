/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication and session management
 *   - name: Users
 *     description: User management and profile operations
 *   - name: Customers
 *     description: Customer management operations
 *   - name: Vendors
 *     description: Vendor management operations
 *   - name: Bookings
 *     description: Travel booking management
 *   - name: Payments
 *     description: Payment and financial transaction management
 *   - name: Files
 *     description: File upload and management
 *   - name: Health
 *     description: API health and status endpoints
 * 
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     description: Check if the API server is running and healthy
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OK"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *                 service:
 *                   type: string
 *                   example: "TMS API"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 * 
 * /ping:
 *   get:
 *     tags: [Health]
 *     summary: Ping endpoint
 *     description: Simple ping endpoint to test API connectivity
 *     responses:
 *       200:
 *         description: Pong response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "pong"
 */