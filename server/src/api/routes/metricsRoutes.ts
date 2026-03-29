import { Express } from 'express';
import { MetricsController } from '../controllers/MetricsController';
import { requireAuth } from '../../middleware/requireAuth';
import { UserRole } from '../../models/FirestoreTypes';

export function registerMetricsRoutes(app: Express) {
  /**
   * @swagger
   * /metrics:
   *   get:
   *     summary: Get cache metrics
   *     description: Retrieve Redis cache performance metrics including hit rate, misses, and operations
   *     tags:
   *       - Metrics
   *     responses:
   *       200:
   *         description: Cache metrics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     cache:
   *                       type: object
   *                       properties:
   *                         hits:
   *                           type: number
   *                         misses:
   *                           type: number
   *                         sets:
   *                           type: number
   *                         deletes:
   *                           type: number
   *                         errors:
   *                           type: number
   *                         hitRate:
   *                           type: string
   *                         totalOps:
   *                           type: number
   *                     timestamp:
   *                       type: string
   *       500:
   *         description: Failed to retrieve metrics
   */
  app.get('/metrics', requireAuth([UserRole.OWNER]), MetricsController.getCacheMetrics);

  /**
   * @swagger
   * /metrics/reset:
   *   post:
   *     summary: Reset cache metrics
   *     description: Reset all cache metrics counters to zero
   *     tags:
   *       - Metrics
   *     responses:
   *       200:
   *         description: Metrics reset successfully
   *       500:
   *         description: Failed to reset metrics
   */
  app.post('/metrics/reset', requireAuth([UserRole.OWNER]), MetricsController.resetCacheMetrics);
}
