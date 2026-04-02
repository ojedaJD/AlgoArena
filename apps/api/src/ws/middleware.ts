import type { Socket } from 'socket.io';
import { verifyToken } from '../config/auth0.js';
import { prisma } from '../config/prisma.js';
import { logger } from '../lib/logger.js';

export interface SocketUser {
  id: string;
  auth0Sub: string;
  role: string;
}

declare module 'socket.io' {
  interface Socket {
    data: {
      user: SocketUser;
    };
  }
}

/**
 * Socket.io authentication middleware.
 * Validates the JWT from the handshake auth object and attaches the user
 * to socket.data for all subsequent event handlers.
 */
export async function authMiddleware(
  socket: Socket,
  next: (err?: Error) => void,
): Promise<void> {
  try {
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
