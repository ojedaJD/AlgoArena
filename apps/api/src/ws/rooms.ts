import type { Server, Socket } from 'socket.io';
import { redis, redisSub } from '../config/redis.js';
import { logger } from '../lib/logger.js';

// ── Room naming conventions ───────────────────────────────────────────
// match:<matchId>     — participants in an active match
// user:<userId>       — personal room for notifications

const PRESENCE_KEY = (room: string) => `ws:presence:${room}`;
const PRESENCE_TTL = 60 * 30; // 30 minutes

/**
 * Join a socket to a named room and record presence in Redis.
 */
export async function joinRoom(
  socket: Socket,
  room: string,
  userId: string,
): Promise<void> {
  socket.join(room);
  await redis.hset(PRESENCE_KEY(room), userId, socket.id);
  await redis.expire(PRESENCE_KEY(room), PRESENCE_TTL);

  logger.debug({ userId, room, socketId: socket.id }, 'Joined room');
}

/**
 * Leave a named room and remove presence from Redis.
 */
export async function leaveRoom(
  socket: Socket,
  room: string,
  userId: string,
): Promise<void> {
  socket.leave(room);
  await redis.hdel(PRESENCE_KEY(room), userId);

  logger.debug({ userId, room, socketId: socket.id }, 'Left room');
}

/**
 * Broadcast a payload to all sockets in a room via the Socket.io server.
 */
export function broadcastToRoom(
  io: Server,
  room: string,
  event: string,
  data: unknown,
): void {
  io.to(room).emit(event, data);
}

/**
 * Get the list of user IDs currently present in a room.
 */
export async function getRoomMembers(room: string): Promise<string[]> {
  const members = await redis.hkeys(PRESENCE_KEY(room));
  return members;
}

/**
 * Check if a specific user is present in a room.
 */
export async function isUserInRoom(
  room: string,
  userId: string,
): Promise<boolean> {
  const exists = await redis.hexists(PRESENCE_KEY(room), userId);
  return exists === 1;
}

/**
 * Set up a Redis subscription listener that forwards messages from
 * match room channels to the appropriate Socket.io rooms.
 * Call this once at server startup.
 */
export function setupRoomBridge(io: Server): void {
  // Use a dedicated subscriber connection for psubscribe
  redisSub.psubscribe('match:room:*');

  redisSub.on('pmessage', (_pattern, channel, message) => {
    // channel format: match:room:<matchId>
    const matchId = channel.replace('match:room:', '');
    const room = `match:${matchId}`;

    try {
      const { event, data } = JSON.parse(message) as {
        event: string;
        data: unknown;
      };
      io.to(room).emit(event, data);
    } catch (err) {
      logger.error({ err, channel }, 'Failed to parse room broadcast message');
    }
  });

  // Also listen for matchmaking notifications
  redisSub.psubscribe('matchmaking:found');
  redisSub.psubscribe('user:*:notification');

  redisSub.on('pmessage', (_pattern, channel, message) => {
    try {
      if (channel === 'matchmaking:found') {
        const { matchId, players } = JSON.parse(message) as {
          matchId: string;
          players: string[];
        };
        for (const playerId of players) {
          io.to(`user:${playerId}`).emit('matchmaking:found', { matchId });
        }
      } else if (channel.startsWith('user:') && channel.endsWith(':notification')) {
        const userId = channel.split(':')[1];
        const data = JSON.parse(message);
        io.to(`user:${userId}`).emit('notification', data);
      }
    } catch {
      // already handled above for match:room messages
    }
  });

  logger.info('Room bridge Redis subscriptions established');
}
