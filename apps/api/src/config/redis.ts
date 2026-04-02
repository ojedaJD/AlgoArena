import Redis from 'ioredis';
import { config } from './env.js';
import { logger } from '../lib/logger.js';

function createRedisClient(name: string): Redis {
  const client = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      const delay = Math.min(times * 200, 5000);
      return delay;
    },
  });

  client.on('connect', () => {
    logger.info(`Redis ${name} client connected`);
  });

  client.on('error', (err: Error) => {
    logger.error({ err }, `Redis ${name} client error`);
  });

  return client;
}

/** Primary Redis client for commands (GET, SET, PUBLISH, etc.) */
export const redis = createRedisClient('commands');

/** Dedicated Redis client for subscriptions (SUBSCRIBE, PSUBSCRIBE) */
export const redisSub = createRedisClient('subscriber');
