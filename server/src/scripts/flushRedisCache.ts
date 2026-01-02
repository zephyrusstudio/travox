/**
 * Redis Cache Flush Script
 * 
 * This script flushes all keys from the Redis cache.
 * Use when stale data is causing issues.
 * 
 * Usage: npx ts-node src/scripts/flushRedisCache.ts
 * 
 * CAUTION: This will clear all cached data, causing temporary increased 
 * load on Firestore as the cache rebuilds.
 */

import { redisClient } from '../config/redis';
import logger from '../config/logger';

async function flushCache() {
  try {
    console.log('Connecting to Redis...');
    
    // Wait for connection if not already connected
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    
    console.log('Flushing all Redis keys...');
    
    // FLUSHDB clears the current database
    await redisClient.flushDb();
    
    console.log('✅ Redis cache flushed successfully!');
    logger.info('Redis cache flushed via script');
    
  } catch (error) {
    console.error('❌ Error flushing Redis cache:', error);
    logger.error({ err: error }, 'Error flushing Redis cache');
  } finally {
    await redisClient.quit();
    process.exit(0);
  }
}

flushCache();
