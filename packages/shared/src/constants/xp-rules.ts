export const XP_RULES = {
  SOLVE_EASY: 50,
  SOLVE_MEDIUM: 100,
  SOLVE_HARD: 200,
  MATCH_WIN: 100,
  MATCH_LOSS: 25,
  MATCH_DRAW: 50,
  DAILY_LOGIN: 10,
  STREAK_BONUS_PER_DAY: 5, // extra XP per day of streak
  FIRST_SOLVE_BONUS: 25, // first time solving a problem
  DISCUSSION_POST: 5,
} as const;

export const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, 10000,
  13000, 16500, 20500, 25000, 30000, 36000, 43000, 51000, 60000,
] as const;

export function getLevelFromXp(totalXp: number): { level: number; xpToNext: number } {
  let level = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]! * 1.5;
  return { level, xpToNext: Math.max(0, nextThreshold - totalXp) };
}
