import { Request, Response } from 'express';
import { container } from '../../config/container';
import { RedisService } from '../../infrastructure/services/RedisService';

export class MetricsController {
  /**
   * Get cache metrics
   */
  static async getCacheMetrics(req: Request, res: Response): Promise<void> {
    try {
      const redisService = container.resolve<RedisService>('RedisService');
      const metrics = redisService.getMetrics();

      res.json({
        success: true,
        data: {
          cache: metrics,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve metrics',
        error: error.message
      });
    }
  }

  /**
   * Reset cache metrics
   */
  static async resetCacheMetrics(req: Request, res: Response): Promise<void> {
    try {
      const redisService = container.resolve<RedisService>('RedisService');
      redisService.resetMetrics();

      res.json({
        success: true,
        message: 'Cache metrics reset successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to reset metrics',
        error: error.message
      });
    }
  }
}
