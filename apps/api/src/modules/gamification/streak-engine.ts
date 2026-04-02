/**
 * Pure streak calculation logic. No DB dependencies.
 *
 * Rules:
 * - If lastActivityDate is today (UTC) -> no change (already counted today).
 * - If lastActivityDate is yesterday (UTC) -> increment streak.
 * - If lastActivityDate is older or null -> reset streak to 1.
 * - Always update lastActivityDate to today.
 * - Track longestStreak as the max of current and previous longest.
 */

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date | null;
}

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  changed: boolean; // whether the streak was actually updated
}

/**
 * Compute the new streak state given the current state and "now" timestamp.
 */
export function computeStreak(
  state: StreakState,
  now: Date = new Date(),
): StreakResult {
  const todayUTC = toUTCDateString(now);
  const lastDateUTC = state.lastActivityDate
    ? toUTCDateString(state.lastActivityDate)
    : null;

  // Same day — no change
  if (lastDateUTC === todayUTC) {
    return {
      currentStreak: state.currentStreak,
      longestStreak: state.longestStreak,
      lastActivityDate: state.lastActivityDate!,
      changed: false,
    };
  }

  const yesterdayUTC = toUTCDateString(
    new Date(now.getTime() - 24 * 60 * 60 * 1000),
  );

  let newStreak: number;

  if (lastDateUTC === yesterdayUTC) {
    // Consecutive day — extend streak
    newStreak = state.currentStreak + 1;
  } else {
    // Gap or first activity — start fresh
    newStreak = 1;
  }

  const newLongest = Math.max(state.longestStreak, newStreak);

  return {
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastActivityDate: now,
    changed: true,
  };
}

/**
 * Convert a Date to a YYYY-MM-DD string in UTC.
 */
function toUTCDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}
