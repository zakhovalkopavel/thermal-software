/**
 * Neufeld et al. (1972) collision-integral fit coefficients (Poling 5th ed.).
 * Ω* = A/T*^B + C/exp(D·T*) + E/exp(F·T*) [+ G/exp(H·T*) for Ω_D].
 */
export const NEUFELD_COLLISION_INTEGRALS = {
  /** Ω^(1,1)* (diffusion) */
  OMEGA_D: {
    A: 1.06036,
    B: 0.15610,
    C: 0.19300,
    D: 0.47635,
    E: 1.03587,
    F: 1.52996,
    G: 1.76474,
    H: 3.89411,
  },
  /** Ω^(2,2)* (viscosity) */
  OMEGA_V: {
    A: 1.16145,
    B: 0.14874,
    C: 0.52487,
    D: 0.77320,
    E: 2.16178,
    F: 2.43787,
  },
} as const;
