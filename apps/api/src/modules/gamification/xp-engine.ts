import { XP_RULES } from '@dsa/shared';

export type XpAction =
  | 'SOLVE_EASY'
  | 'SOLVE_MEDIUM'
  | 'SOLVE_HARD'
  | 'MATCH_WIN'
  | 'MATCH_LOSS'
  | 'MATCH_DRAW'
  | 'DAILY_LOGIN'
  | 'FIRST_SOLVE_BONUS'
  | 'DISCUSSION_POST'
  | 'STREAK_BONUS';

/**
 * Calculate the XP award for a given action.
 *
 * @param action  The type of action that earned XP.
 * @param context Additional context (e.g., currentStreak for streak bonus).
 * @returns       The XP delta to award.
 */
export function calculateXp(
  action: XpAction,
  context?: { currentStreak?: number },
): number {
  switch (action) {
    case 'SOLVE_EASY':
      return XP_RULES.SOLVE_EASY;
    case 'SOLVE_MEDIUM':
      return XP_RULES.SOLVE_MEDIUM;
    case 'SOLVE_HARD':
      return XP_RULES.SOLVE_HARD;
    case 'MATCH_WIN':
      return XP_RULES.MATCH_WIN;
    case 'MATCH_LOSS':
      return XP_RULES.MATCH_LOSS;
    case 'MATCH_DRAW':
      return XP_RULES.MATCH_DRAW;
    case 'DAILY_LOGIN':
      return XP_RULES.DAILY_LOGIN;
    case 'FIRST_SOLVE_BONUS':
      return XP_RULES.FIRST_SOLVE_BONUS;
    case 'DISCUSSION_POST':
      return XP_RULES.DISCUSSION_POST;
    case 'STREAK_BONUS':
      return XP_RULES.STREAK_BONUS_PER_DAY * (context?.currentStreak ?? 1);
    default:
      return 0;
  }
}

/**
 * Map a problem difficulty to the corresponding XP action.
 */
export function difficultyToAction(
  difficulty: 'EASY' | 'MEDIUM' | 'HARD',
): XpAction {
  switch (difficulty) {
    case 'EASY':
      return 'SOLVE_EASY';
    case 'MEDIUM':
      return 'SOLVE_MEDIUM';
    case 'HARD':
      return 'SOLVE_HARD';
  }
}

/**
 * Map a match outcome to the corresponding XP action.
 */
export function matchOutcomeToAction(
  outcome: 'win' | 'loss' | 'draw',
): XpAction {
  switch (outcome) {
    case 'win':
      return 'MATCH_WIN';
    case 'loss':
      return 'MATCH_LOSS';
    case 'draw':
      return 'MATCH_DRAW';
  }
}
