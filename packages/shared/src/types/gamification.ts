export interface XpLedgerEntry {
  id: string;
  userId: string;
  delta: number;
  reason: string;
  refType: string | null;
  refId: string | null;
  createdAt: string;
}

export interface UserStreak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
}

export interface Achievement {
  id: string;
  slug: string;
  title: string;
  description: string;
  iconUrl: string | null;
  criteria: Record<string, unknown>;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: string;
}

export interface UserProgress {
  userId: string;
  totalXp: number;
  level: number;
  xpToNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  problemsSolved: number;
  matchesPlayed: number;
  matchesWon: number;
  achievements: UserAchievement[];
}
