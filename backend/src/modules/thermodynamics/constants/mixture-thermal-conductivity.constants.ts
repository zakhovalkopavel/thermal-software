/**
 * Mixture gas thermal conductivity: switch between Hirschfelder–Eucken (low density)
 * and Chung et al. 1988 (high density) using Chung’s density parameter y = Vc/(6V).
 */
export const MIXTURE_THERMAL_CONDUCTIVITY = {
  /**
   * Use Hirschfelder–Eucken when y < this value; Chung 1988 when y ≥ this value.
   * At atmospheric pressure for common gases y ≪ 0.01.
   */
  Y_SWITCH: 0.01,
  /** Translational Eucken factor λ_tr = (15/4)·(R/M)·η */
  TRANSLATIONAL_EUCKEN_FACTOR: 15 / 4,
} as const;
