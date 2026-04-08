import { redisSub } from '../../config/redis.js';
import { logger } from '../../lib/logger.js';
import { ratingService } from '../ratings/ratings.service.js';
import { gamificationService } from '../gamification/gamification.service.js';
import { matchOutcomeToAction } from '../gamification/xp-engine.js';

interface MatchCompletedPayload {
  matchId: string;
  winnerId: string | null;
  participants: string[];
}

/**
 * Subscribe to the `match:completed` Redis channel and trigger:
 * 1. Glicko-2 rating updates for both players (RANKED only).
 * 2. XP awards (participation + win bonus).
 * 3. Streak check for each participant.
 * 4. Achievement check for each participant.
 *
 * Call once at server startup.
 */
export function setupMatchCompletionHandler(): void {
  redisSub.subscribe('match:completed');

  redisSub.on('message', async (channel, message) => {
    if (channel !== 'match:completed') return;

    let payload: MatchCompletedPayload;
    try {
      payload = JSON.parse(message) as MatchCompletedPayload;
    } catch {
      logger.error({ message }, 'Failed to parse match:completed payload');
      return;
    }

    const { matchId, winnerId, participants } = payload;

    logger.info({ matchId, winnerId, participants }, 'Processing match completion');

    try {
      // ── 1. Rating update (needs exactly 2 participants) ──────────
      const isDraw = winnerId === null;
      const loserId =
        winnerId && participants.length === 2
          ? participants.find((id) => id !== winnerId) ?? null
          : null;

      await ratingService.updateRatings(matchId, winnerId, loserId, isDraw, participants);

      // ── 2. XP awards for each participant ────────────────────────
      for (const userId of participants) {
        let outcome: 'win' | 'loss' | 'draw';
        if (isDraw) {
          outcome = 'draw';
        } else if (userId === winnerId) {
          outcome = 'win';
        } else {
          outcome = 'loss';
        }

        const action = matchOutcomeToAction(outcome);
        await gamificationService.awardXp(
          userId,
          action,
          `Match ${outcome}: ${matchId}`,
          'match',
          matchId,
        );

        // ── 3. Streak check (first daily activity) ───────────────
        await gamificationService.checkAndUpdateStreak(userId);

        // ── 4. Achievement check ─────────────────────────────────
        await gamificationService.checkAchievements(userId);
      }

      logger.info({ matchId }, 'Match completion processing done');
    } catch (err) {
      logger.error({ err, matchId }, 'Error processing match completion');
    }
  });

  logger.info('Match completion handler subscribed to match:completed');
}
