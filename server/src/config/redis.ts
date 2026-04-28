import { createClient } from 'redis';
import logger from './logger';

const redisUrl = process.env.REDIS_URL;
const redisEnabled = process.env.REDIS_ENABLED !== 'false' && (process.env.NODE_ENV === 'production' || Boolean(redisUrl));

const redisClient = createClient({
  url: redisUrl || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries: number) => {
      if (retries > 10) {
        logger.error('Redis: Max reconnection attempts reached');
        return new Error('Redis: Max reconnection attempts reached');
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.on('connect', () => logger.info('Redis Client Connected'));
redisClient.on('ready', () => logger.info('Redis Client Ready'));
redisClient.on('reconnecting', () => logger.warn('Redis Client Reconnecting'));

// Connect to Redis
(async () => {
  if (!redisEnabled) {
    logger.warn('Redis disabled: set REDIS_URL or REDIS_ENABLED=true to enable cache locally');
    return;
  }

  try {
    await redisClient.connect();
  } catch (error) {
    logger.error({ err: error }, 'Failed to connect to Redis');
  }
})();

export { redisClient, redisEnabled };
