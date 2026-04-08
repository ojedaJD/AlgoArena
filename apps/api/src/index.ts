import Fastify from 'fastify';
import { config } from './config/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './config/prisma.js';
import { redis, redisSub } from './config/redis.js';

// Plugins
import corsPlugin from './plugins/cors.js';
import errorHandlerPlugin from './plugins/error-handler.js';
import authPlugin from './plugins/auth.js';
import rateLimitPlugin from './plugins/rate-limit.js';
import websocketPlugin from './plugins/websocket.js';

// Routes
import { userRoutes } from './modules/users/users.routes.js';
import { problemRoutes } from './modules/problems/problems.routes.js';
import { submissionRoutes } from './modules/submissions/submissions.routes.js';
import { curriculumRoutes } from './modules/curriculum/curriculum.routes.js';
import { matchRoutes } from './modules/matches/matches.routes.js';
import { ratingRoutes } from './modules/ratings/ratings.routes.js';
import { gamificationRoutes } from './modules/gamification/gamification.routes.js';
import { socialRoutes } from './modules/social/social.routes.js';
import { leaderboardRoutes } from './modules/leaderboard/leaderboard.routes.js';
import { discussionRoutes } from './modules/discussions/discussions.routes.js';

async function main() {
  const app = Fastify({
    logger: false, // We use our own pino instance
    trustProxy: true,
  });

  // ── Plugins ──────────────────────────────────────────────────────
  await app.register(corsPlugin);
  await app.register(errorHandlerPlugin);
  await app.register(authPlugin);
  await app.register(rateLimitPlugin);
  await app.register(websocketPlugin);

  // ── Health Check ─────────────────────────────────────────────────
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  // ── Module Routes ────────────────────────────────────────────────
  // Routes already include the /v1 prefix in their path definitions.
  await app.register(userRoutes);
  await app.register(problemRoutes);
  await app.register(submissionRoutes);
  await app.register(curriculumRoutes);
  await app.register(matchRoutes);
  await app.register(ratingRoutes);
  await app.register(gamificationRoutes);
  await app.register(socialRoutes);
  await app.register(leaderboardRoutes);
  await app.register(discussionRoutes);

  // ── Start ────────────────────────────────────────────────────────
  try {
    await app.listen({ port: config.API_PORT, host: '0.0.0.0' });
    logger.info(`Server listening on http://0.0.0.0:${config.API_PORT}`);
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }

  // ── Graceful Shutdown ────────────────────────────────────────────
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

  for (const signal of signals) {
    process.on(signal, async () => {
      logger.info(`Received ${signal}, shutting down gracefully...`);

      try {
        await app.close();
        await prisma.$disconnect();
        redis.disconnect();
        redisSub.disconnect();
        logger.info('All connections closed. Goodbye.');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error during shutdown');
        process.exit(1);
      }
    });
  }
}

main();
