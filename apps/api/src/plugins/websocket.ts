import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { redis, redisSub } from '../config/redis.js';
import { verifyToken } from '../config/auth0.js';
import { prisma } from '../config/prisma.js';
import { logger } from '../lib/logger.js';

declare module 'fastify' {
  interface FastifyInstance {
    io: Server;
  }
}

async function websocketPlugin(fastify: FastifyInstance) {
  const io = new Server(fastify.server, {
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

  // Authentication middleware: validate JWT on handshake
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ??
        socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const payload = await verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { auth0Sub: payload.sub },
        select: { id: true, auth0Sub: true, role: true },
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.data.user = user;
      next();
    } catch {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.user?.id;
    logger.info({ userId, socketId: socket.id }, 'WebSocket client connected');

    // Join a personal room for targeted notifications
    if (userId) {
      socket.join(`user:${userId}`);
    }

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
