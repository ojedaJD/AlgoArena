import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import { redis } from '../config/redis.js';
import { config } from '../config/env.js';

async function rateLimitPlugin(fastify: FastifyInstance) {
  await fastify.register(rateLimit, {
    max: config.NODE_ENV === 'production' ? 100 : 1000,
    timeWindow: '1 minute',
    redis,
    keyGenerator: (request) => {
      // Use authenticated user ID if available, otherwise fall back to IP
      return request.user?.id ?? request.ip;
    },
    errorResponseBuilder: (_request, context) => ({
      error: 'RateLimitError',
      message: `Rate limit exceeded. Retry after ${context.after}`,
      statusCode: 429,
    }),
  });
}

export default fp(rateLimitPlugin, {
  name: 'rate-limit',
});
