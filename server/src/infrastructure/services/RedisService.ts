import { injectable } from 'tsyringe';
import { redisClient } from '../../config/redis';
import logger from '../../config/logger';

/**
 * REDIS CACHING STRATEGY & RACE CONDITION PREVENTION
 * 
 * CRITICAL NOTES ON CACHE INVALIDATION TIMING:
 * 
 * 1. WHY INVALIDATE BEFORE WRITES (not after):
 *    - Prevents serving stale data during the DB write operation
 *    - Eliminates race conditions where concurrent requests read stale cache
 *    - Ensures next read always fetches fresh data from Firestore
 * 
 * 2. DATE SERIALIZATION:
 *    - Redis stores data as JSON strings (Date objects become strings)
 *    - MUST use rehydrateObject() to restore Date objects and prototype methods
 *    - See: utils/cacheRehydration.ts and COMMON_DATE_FIELDS
 * 
 * 3. PAYMENT RACE CONDITIONS:
 *    - Multiple concurrent payment requests MUST invalidate cache before fetching booking
 *    - CreateReceivable validates payment won't exceed dueAmount
 *    - Cache invalidated BEFORE payment creation and booking update
 * 
 * 4. WHEN TO USE TRANSACTIONS (Not currently implemented):
 *    - For critical operations requiring atomic reads + writes
 *    - Consider Firestore transactions if concurrent payments are frequent
 *    - Current strategy relies on optimistic validation (check before write)
 * 
 * 5. TTL VALUES:
 *    - ENTITY_TTL: 300s (5 min) - Individual records
 *    - LIST_TTL: 900s (15 min) - List queries and aggregations  
 *    - STATS_TTL: 120s (2 min) - Computed statistics
 * 
 * @see CachedBookingRepository - Invalidates before update()
 * @see CachedPaymentRepository - Invalidates before create()
 * @see CreateReceivable - Invalidates cache before fetching booking
 */

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
      logger.error({ err: error, key }, 'Redis GET error');
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
      logger.error({ err: error, key }, 'Redis SET error');
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
      logger.error({ err: error, key }, 'Redis DELETE error');
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
      logger.error({ err: error, pattern }, 'Redis INVALIDATE error');
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
