import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { redis, redisSub } from '../config/redis.js';
import { logger } from '../lib/logger.js';
import { authMiddleware } from '../ws/middleware.js';
import { registerHandlers } from '../ws/handlers.js';
import type { ServerToClientEvents, ClientToServerEvents } from '@dsa/shared';

declare module 'fastify' {
  interface FastifyInstance {
    io: Server<ClientToServerEvents, ServerToClientEvents>;
  }
}

async function websocketPlugin(fastify: FastifyInstance) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(fastify.server, {
    cors: {
      origin:
        process.env.NODE_ENV === 'production'
          ? /\.algoarena\.com$/
          : ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Redis adapter for horizontal scaling across multiple server instances
  io.adapter(createAdapter(redis, redisSub));

  // Authentication middleware: validate JWT on handshake (with dev mode bypass)
  io.use(authMiddleware);

  io.on('connection', (socket) => {
    const userId = socket.data.user?.id;
    logger.info({ userId, socketId: socket.id }, 'WebSocket client connected');

    // Join a personal room for targeted notifications
    if (userId) {
      socket.join(`user:${userId}`);
    }

    // Register all event handlers for this socket
    registerHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      logger.debug({ userId, socketId: socket.id, reason }, 'WebSocket client disconnected');
    });
  });

  fastify.decorate('io', io);

  fastify.addHook('onClose', async () => {
    io.close();
  });
}

export default fp(websocketPlugin, {
  name: 'websocket',
});
