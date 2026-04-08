import type { Socket } from 'socket.io';
import { verifyToken } from '../config/auth0.js';
import { prisma } from '../config/prisma.js';
import { config } from '../config/env.js';
import { logger } from '../lib/logger.js';

export interface SocketUser {
  id: string;
  auth0Sub: string;
  role: string;
}

declare module 'socket.io' {
  interface SocketData {
    user: SocketUser;
  }
}

// Dev mode: skip Auth0 JWT validation when no real domain is configured
const isDevMode = !config.AUTH0_DOMAIN || config.AUTH0_DOMAIN === 'your-tenant.us.auth0.com';

/**
 * Socket.io authentication middleware.
 * Validates the JWT from the handshake auth object and attaches the user
 * to socket.data for all subsequent event handlers.
 * In dev mode (no Auth0 configured), uses a mock admin user.
 */
export async function authMiddleware(
  socket: Socket,
  next: (err?: Error) => void,
): Promise<void> {
  try {
    // Dev mode bypass — upsert a local dev user and skip token validation
    if (isDevMode) {
      const user = await prisma.user.upsert({
        where: { auth0Sub: 'dev|local' },
        update: {},
        create: {
          auth0Sub: 'dev|local',
          email: 'dev@algoarena.local',
          role: 'ADMIN',
        },
        select: { id: true, auth0Sub: true, role: true },
      });
      socket.data.user = user;
      return next();
    }

    const token =
      socket.handshake.auth?.token ??
      socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token || typeof token !== 'string') {
      return next(new Error('Authentication required: no token provided'));
    }

    const payload = await verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { auth0Sub: payload.sub },
      select: { id: true, auth0Sub: true, role: true },
    });

    if (!user) {
      return next(new Error('Authentication failed: user not found'));
    }

    socket.data.user = user;
    next();
  } catch (err) {
    logger.warn({ err, socketId: socket.id }, 'Socket authentication failed');
    next(new Error('Authentication failed: invalid or expired token'));
  }
}
