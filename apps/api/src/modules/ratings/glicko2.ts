/**
 * Pure Glicko-2 rating algorithm implementation.
 * Based on Mark Glickman's paper: http://www.glicko.net/glicko/glicko2.pdf
 *
 * No external dependencies. All inputs/outputs use the original Glicko scale
 * (centered at 1500). Internal calculations use the Glicko-2 scale.
 */

export interface Glicko2Player {
  rating: number; // mu  (Glicko scale, e.g. 1500)
  rd: number; // phi (rating deviation, e.g. 350)
  volatility: number; // sigma (e.g. 0.06)
}

export interface Glicko2Result {
  rating: number;
  rd: number;
  volatility: number;
}

// ── Glicko-2 scale conversion factor ──────────────────────────────────
const SCALE = 173.7178;

// ── Helper functions ──────────────────────────────────────────────────

/** g(phi) — the "weight" of the opponent's RD. */
function g(phi: number): number {
  return 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
}

/** E(mu, mu_j, phi_j) — expected score vs one opponent. */
function E(mu: number, muJ: number, phiJ: number): number {
  return 1 / (1 + Math.exp(-g(phiJ) * (mu - muJ)));
}

/**
 * Calculate updated Glicko-2 parameters for a player after a single game.
 *
 * @param player   Player's current rating parameters (Glicko scale).
 * @param opponent Opponent's current rating parameters (Glicko scale).
 * @param outcome  1 = win, 0.5 = draw, 0 = loss.
 * @param tau      System constant controlling volatility change (typically 0.3–1.2).
 * @returns        Updated rating parameters for the player (Glicko scale).
 */
export function calculateGlicko2(
  player: Glicko2Player,
  opponent: Glicko2Player,
  outcome: number,
  tau: number = 0.5,
): Glicko2Result {
  // ── Step 1: Convert to Glicko-2 scale ───────────────────────────────
  const mu = (player.rating - 1500) / SCALE;
  const phi = player.rd / SCALE;
  const sigma = player.volatility;

  const muJ = (opponent.rating - 1500) / SCALE;
  const phiJ = opponent.rd / SCALE;

  // ── Step 2: Compute variance (v) ───────────────────────────────────
  const gPhiJ = g(phiJ);
  const eVal = E(mu, muJ, phiJ);
  const v = 1 / (gPhiJ * gPhiJ * eVal * (1 - eVal));

  // ── Step 3: Compute estimated improvement (delta) ──────────────────
  const delta = v * gPhiJ * (outcome - eVal);

  // ── Step 4: Compute new volatility (sigma') ────────────────────────
  // Using the Illinois algorithm variant for the iterative procedure
  const a = Math.log(sigma * sigma);
  const tauSq = tau * tau;
  const phiSq = phi * phi;
  const deltaSq = delta * delta;

  // f(x) function from the paper
  function f(x: number): number {
    const ex = Math.exp(x);
    const num1 = ex * (deltaSq - phiSq - v - ex);
    const den1 = 2 * (phiSq + v + ex) * (phiSq + v + ex);
    return num1 / den1 - (x - a) / tauSq;
  }

  // Initial bounds
  let A = a;
  let B: number;

  if (deltaSq > phiSq + v) {
    B = Math.log(deltaSq - phiSq - v);
  } else {
    let k = 1;
    while (f(a - k * tau) < 0) {
      k++;
    }
    B = a - k * tau;
  }

  // Iterative convergence (Illinois algorithm)
  let fA = f(A);
  let fB = f(B);
  const EPSILON = 1e-6;

  while (Math.abs(B - A) > EPSILON) {
    const C = A + ((A - B) * fA) / (fB - fA);
    const fC = f(C);

    if (fC * fB <= 0) {
      A = B;
      fA = fB;
    } else {
      fA = fA / 2;
    }

    B = C;
    fB = fC;
  }

  const newSigma = Math.exp(A / 2);

  // ── Step 5: Update phi* (pre-rating-period value) ──────────────────
  const phiStar = Math.sqrt(phiSq + newSigma * newSigma);

  // ── Step 6: Update phi' ────────────────────────────────────────────
  const newPhi = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);

  // ── Step 7: Update mu' ─────────────────────────────────────────────
  const newMu = mu + newPhi * newPhi * gPhiJ * (outcome - eVal);

  // ── Step 8: Convert back to Glicko scale ───────────────────────────
  return {
    rating: newMu * SCALE + 1500,
    rd: newPhi * SCALE,
    volatility: newSigma,
  };
}

/**
 * Apply RD decay for an inactive period (no games played).
 * phi* = sqrt(phi^2 + sigma^2) for each rating period elapsed.
 */
export function decayRd(
  player: Glicko2Player,
  periods: number = 1,
): Glicko2Player {
  const phi = player.rd / SCALE;
  const sigma = player.volatility;

  let newPhi = phi;
  for (let i = 0; i < periods; i++) {
    newPhi = Math.sqrt(newPhi * newPhi + sigma * sigma);
  }

  return {
    ...player,
    rd: Math.min(newPhi * SCALE, 500), // cap at max RD
  };
}
