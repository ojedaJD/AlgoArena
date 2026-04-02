export const RATING_DEFAULTS = {
  INITIAL_RATING: 1500,
  INITIAL_RD: 350,
  INITIAL_VOLATILITY: 0.06,
  SYSTEM_TAU: 0.5,
  MIN_RD: 30,
  MAX_RD: 500,
  PROVISIONAL_THRESHOLD: 10, // games before rating is considered settled
} as const;
