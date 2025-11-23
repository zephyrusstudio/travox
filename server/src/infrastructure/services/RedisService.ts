import { injectable } from 'tsyringe';
import { redisClient } from '../../config/redis';
import logger from '../../config/logger';

interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
}

@injectable()
export class RedisService {
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0
  };

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redisClient.get(key);
      
      if (value) {
        this.metrics.hits++;
        return JSON.parse(value) as T;
      }
      
      this.metrics.misses++;
      return null;
    } catch (error) {
      this.metrics.errors++;
      logger.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL (in seconds)
   */
  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      this.metrics.sets++;
    } catch (error) {
      this.metrics.errors++;
      logger.error(`Redis SET error for key ${key}:`, error);
    }
  }

  /**
   * Delete a single key
   */
  async delete(key: string): Promise<void> {
    try {
      await redisClient.del(key);
      this.metrics.deletes++;
    } catch (error) {
      this.metrics.errors++;
      logger.error(`Redis DELETE error for key ${key}:`, error);
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
        this.metrics.deletes += keys.length;
        logger.info(`Invalidated ${keys.length} keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      this.metrics.errors++;
      logger.error(`Redis INVALIDATE error for pattern ${pattern}:`, error);
    }
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics & { hitRate: string; totalOps: number } {
    const totalOps = this.metrics.hits + this.metrics.misses;
    const hitRate = totalOps > 0 
      ? ((this.metrics.hits / totalOps) * 100).toFixed(2) 
      : '0.00';

    return {
      ...this.metrics,
      hitRate: `${hitRate}%`,
      totalOps
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
  }

  /**
   * Generate cache key for entity by ID
   */
  generateKey(collection: string, orgId: string, id: string): string {
    return `${collection}:${orgId}:${id}`;
  }

  /**
   * Generate cache key for list queries
   */
  generateListKey(collection: string, orgId: string, params: Record<string, any> = {}): string {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return paramString 
      ? `${collection}:${orgId}:list:${paramString}`
      : `${collection}:${orgId}:list`;
  }
}
