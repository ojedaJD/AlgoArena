import type { Server, Socket } from 'socket.io';
import { logger } from '../lib/logger.js';
import { prisma } from '../config/prisma.js';
import { MatchStateMachine } from '../modules/matches/match-state-machine.js';
import { matchService } from '../modules/matches/matches.service.js';
import { joinRoom, leaveRoom } from './rooms.js';

/**
 * Register all Socket.io event handlers on a connected socket.
 * Called once per connection after authentication succeeds.
 */
export function registerHandlers(io: Server, socket: Socket): void {
  const userId: string = socket.data.user.id;

  // ── match:join ──────────────────────────────────────────────────────
  socket.on('match:join', async (data: { matchId: string }) => {
    try {
      const { matchId } = data;

      // Verify user is a participant
      const participant = await prisma.matchParticipant.findFirst({
        where: { matchId, userId },
      });

      if (!participant) {
        socket.emit('error', { message: 'You are not a participant in this match' });
        return;
      }

      // Join the socket room
      await joinRoom(socket, `match:${matchId}`, userId);

      // Load state machine and add participant if needed
      let machine = await MatchStateMachine.loadState(matchId);
      if (machine) {
        const profile = await prisma.userProfile.findUnique({
          where: { userId },
          select: { displayName: true },
        });
        await machine.addParticipant(userId, profile?.displayName ?? 'Anonymous');

        // Send current state to the joining player
        socket.emit('match:state', machine.toRoomState());
      } else {
        socket.emit('error', {
          message: 'Match state not found',
          code: 'MATCH_STATE_MISSING',
        });
      }
    } catch (err) {
      logger.error({ err, userId }, 'Error handling match:join');
      socket.emit('error', { message: 'Failed to join match' });
    }
  });

  // ── match:ready ─────────────────────────────────────────────────────
  socket.on('match:ready', async (data: { matchId: string }) => {
    try {
      const { matchId } = data;

      const machine = await MatchStateMachine.loadState(matchId);
      if (!machine) {
        socket.emit('error', { message: 'Match not found' });
        return;
      }

      await machine.playerReady(userId);
    } catch (err) {
      logger.error({ err, userId }, 'Error handling match:ready');
      socket.emit('error', { message: 'Failed to ready up' });
    }
  });

  // ── match:submit ────────────────────────────────────────────────────
  socket.on(
    'match:submit',
    async (data: { matchId: string; code: string; language: string }) => {
      try {
        const { matchId, code, language } = data;

        const machine = await MatchStateMachine.loadState(matchId);
        if (!machine) {
          socket.emit('error', { message: 'Match not found' });
          return;
        }

        // Load match to get the problem
        const match = await prisma.match.findUnique({
          where: { id: matchId },
          select: { problemId: true },
        });

        if (!match?.problemId) {
          socket.emit('error', { message: 'Match has no associated problem' });
          return;
        }

        // Create a submission record
        const testCaseCount = await prisma.testCase.count({
          where: { problemId: match.problemId },
        });

        const submission = await prisma.submission.create({
          data: {
            userId,
            problemId: match.problemId,
            matchId,
            language,
            code,
            status: 'PENDING',
            totalCases: testCaseCount,
          },
        });

        // Record the submission in the state machine
        await machine.playerSubmitted(userId, submission.id);

        // Publish submission for the judge worker to pick up
        const { redis } = await import('../config/redis.js');
        await redis.lpush(
          'judge:queue',
          JSON.stringify({
            submissionId: submission.id,
            matchId,
            userId,
          }),
        );

        socket.emit('match:state', machine.toRoomState());
      } catch (err) {
        logger.error({ err, userId }, 'Error handling match:submit');
        socket.emit('error', { message: 'Failed to submit code' });
      }
    },
  );

  // ── match:leave ─────────────────────────────────────────────────────
  socket.on('match:leave', async (data: { matchId: string }) => {
    try {
      const { matchId } = data;

      await leaveRoom(socket, `match:${matchId}`, userId);

      const machine = await MatchStateMachine.loadState(matchId);
      if (machine) {
        const state = machine.currentState;
        // If match hasn't completed/cancelled, cancel due to abandon
        if (
          state !== 'COMPLETED' &&
          state !== 'CANCELLED'
        ) {
          await machine.cancel(`Player abandoned the match`);
        }
      }
    } catch (err) {
      logger.error({ err, userId }, 'Error handling match:leave');
    }
  });

  // ── matchmaking:join ────────────────────────────────────────────────
  socket.on('matchmaking:join', async (data: { mode: string }) => {
    try {
      const result = await matchService.joinQueue(userId, data.mode);

      if (result) {
        socket.emit('matchmaking:found', { matchId: result.matchId });
      } else {
        socket.emit('matchmaking:status', {
          position: 0,
          estimatedWaitMs: 30000,
        });
      }
    } catch (err) {
      logger.error({ err, userId }, 'Error handling matchmaking:join');
      socket.emit('error', {
        message: err instanceof Error ? err.message : 'Failed to join queue',
      });
    }
  });

  // ── matchmaking:cancel ──────────────────────────────────────────────
  socket.on('matchmaking:cancel', async () => {
    try {
      await matchService.leaveQueue(userId);
    } catch (err) {
      logger.error({ err, userId }, 'Error handling matchmaking:cancel');
    }
  });

  // ── disconnect ──────────────────────────────────────────────────────
  socket.on('disconnect', async () => {
    try {
      // Clean up matchmaking queue on disconnect
      await matchService.leaveQueue(userId);
    } catch (err) {
      logger.error({ err, userId }, 'Error cleaning up on disconnect');
    }
  });
}
