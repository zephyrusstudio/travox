import { injectable } from 'tsyringe';
import { redisClient, redisEnabled } from '../../config/redis';
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
 *    - CreateOutboundRefund/CreateInboundRefund invalidate caches before fetching related entities
 *    - Cache invalidated BEFORE payment creation and entity updates
 * 
 * 4. CROSS-ENTITY CACHE INVALIDATION:
 *    - Refunds affect bookings, customers, and vendors - all caches must be invalidated
 *    - Use invalidateCacheForBooking(), invalidateCacheForCustomer(), invalidateCacheForVendor()
 *    - Use invalidateCacheForPayment() and invalidateCacheForBookingPayments() for payment caches
 * 
 * 5. WHEN TO USE TRANSACTIONS (Not currently implemented):
 *    - For critical operations requiring atomic reads + writes
 *    - Consider Firestore transactions if concurrent payments are frequent
 *    - Current strategy relies on optimistic validation (check before write)
 * 
 * 6. TTL VALUES:
 *    - ENTITY_TTL: 300s (5 min) - Individual records
 *    - LIST_TTL: 900s (15 min) - List queries and aggregations  
 *    - STATS_TTL: 120s (2 min) - Computed statistics
 * 
 * @see CachedBookingRepository - Invalidates before update(), exposes invalidateCacheForBooking()
 * @see CachedPaymentRepository - Invalidates before create(), exposes invalidateCacheForPayment()
 * @see CachedCustomerRepository - Exposes invalidateCacheForCustomer()
 * @see CachedVendorRepository - Exposes invalidateCacheForVendor()
 * @see CreateReceivable - Invalidates booking and customer caches before operations
 * @see CreateOutboundRefund - Invalidates payment, booking, and customer caches before operations
 * @see CreateInboundRefund - Invalidates payment and vendor caches before operations
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

  private isAvailable(): boolean {
    return redisEnabled && redisClient.isReady;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) {
      this.metrics.misses++;
      return null;
    }

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
    if (!this.isAvailable()) {
      return;
    }

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
    if (!this.isAvailable()) {
      return;
    }

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
    if (!this.isAvailable()) {
      return;
    }

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
   * Delete multiple keys at once (more efficient than multiple individual deletes)
   */
  async deleteMany(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    if (!this.isAvailable()) {
      return;
    }
    
    try {
      await redisClient.del(keys);
      this.metrics.deletes += keys.length;
      logger.debug(`Deleted ${keys.length} keys`);
    } catch (error) {
      this.metrics.errors++;
      logger.error({ err: error, keyCount: keys.length }, 'Redis DELETE MANY error');
    }
  }

  /**
   * Invalidate multiple patterns at once (more efficient than sequential pattern invalidation)
   * This is especially useful for cross-entity cache invalidation
   */
  async invalidatePatterns(patterns: string[]): Promise<void> {
    if (patterns.length === 0) return;
    if (!this.isAvailable()) {
      return;
    }
    
    try {
      const allKeys: string[] = [];
      
      // Gather all keys matching any pattern
      for (const pattern of patterns) {
        const keys = await redisClient.keys(pattern);
        allKeys.push(...keys);
      }
      
      // Remove duplicates and delete all at once
      const uniqueKeys = [...new Set(allKeys)];
      if (uniqueKeys.length > 0) {
        await redisClient.del(uniqueKeys);
        this.metrics.deletes += uniqueKeys.length;
        logger.info(`Invalidated ${uniqueKeys.length} keys matching ${patterns.length} patterns`);
      }
    } catch (error) {
      this.metrics.errors++;
      logger.error({ err: error, patterns }, 'Redis INVALIDATE PATTERNS error');
    }
  }

  /**
   * Check if a key exists in cache (useful for pre-validation)
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      this.metrics.errors++;
      logger.error({ err: error, key }, 'Redis EXISTS error');
      return false;
    }
  }

  /**
   * Get remaining TTL for a key (useful for debugging cache issues)
   */
  async getTTL(key: string): Promise<number> {
    if (!this.isAvailable()) {
      return -2;
    }

    try {
      return await redisClient.ttl(key);
    } catch (error) {
      this.metrics.errors++;
      logger.error({ err: error, key }, 'Redis TTL error');
      return -2; // Key doesn't exist
    }
  }

  /**
   * Generate cache key for entity by ID
   */
  generateKey(collection: string, orgId: string, id: string): string {
    return `${collection}:${orgId}:${id}`;
  }

  /**
   * Generate cache key for list queries
   * Note: Filters out undefined/null values to ensure consistent cache keys
   */
  generateListKey(collection: string, orgId: string, params: Record<string, any> = {}): string {
    const paramString = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return paramString 
      ? `${collection}:${orgId}:list:${paramString}`
      : `${collection}:${orgId}:list`;
  }
}
