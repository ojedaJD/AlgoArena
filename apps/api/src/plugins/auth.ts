import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { verifyToken } from '../config/auth0.js';
import { prisma } from '../config/prisma.js';
import { UnauthorizedError, ForbiddenError } from '../lib/errors.js';
import type { UserRole } from '@prisma/client';

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: string;
      auth0Sub: string;
      role: UserRole;
    };
  }
}

async function authPlugin(fastify: FastifyInstance) {
  fastify.decorateRequest('user', null);
}

export default fp(authPlugin, {
  name: 'auth',
});

/**
 * Pre-handler that extracts and verifies the Bearer token,
 * upserts the user in the database, and attaches user info to the request.
 */
export async function requireAuth(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or malformed Authorization header');
  }

  const token = authHeader.slice(7);
  const payload = await verifyToken(token);

  const sub = payload.sub;
  const email = typeof payload.email === 'string' ? payload.email : null;

  // Upsert: create user on first login, update email on subsequent logins
  const user = await prisma.user.upsert({
    where: { auth0Sub: sub },
    update: { email },
    create: {
      auth0Sub: sub,
      email,
    },
    select: {
      id: true,
      auth0Sub: true,
      role: true,
    },
  });

  request.user = user;
}

/**
 * Pre-handler that requires the user to have the ADMIN role.
 * Must be used after requireAuth.
 */
export async function requireAdmin(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  if (!request.user) {
    throw new UnauthorizedError('Authentication required');
  }

  if (request.user.role !== 'ADMIN') {
    throw new ForbiddenError('Admin access required');
  }
}
