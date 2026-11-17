export const QUADRATURE = {
  /** Number of uniform samples used by the oscillation detector */
  OSCILLATION_PROBE_POINTS: 20,
  /**
   * Sign-change count threshold above which the integrand is considered oscillating.
   * A purely smooth integrand typically has 0–1 sign changes; ≥ 3 suggests oscillation.
   */
  OSCILLATION_THRESHOLD: 3,
} as const;
