export interface Rating {
  userId: string;
  mode: string;
  ratingValue: number;
  rd: number;
  volatility: number;
  gamesPlayed: number;
  updatedAt: string;
}

export interface RatingHistory {
  id: string;
  userId: string;
  matchId: string;
  ratingBefore: number;
  ratingAfter: number;
  rdBefore: number;
  rdAfter: number;
  createdAt: string;
}

export interface Glicko2Params {
  rating: number;
  rd: number;
  volatility: number;
}

export interface Glicko2Result {
  rating: number;
  rd: number;
  volatility: number;
}
