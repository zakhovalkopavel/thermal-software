/**
 * Lennard-Jones combining rules for binary pairs (Lorentz–Berthelot).
 * Refs: [Poling5] §11-3.
 */
export class LennardJonesCombining {
  /** σ₁₂ [same units as inputs, typically Å]. */
  static sigma12(sigmaA: number, sigmaB: number): number {
    return 0.5 * (sigmaA + sigmaB);
  }

  /** (ε₁₂/k) [K]. */
  static epsilon12(epsilonToKbA: number, epsilonToKbB: number): number {
    return Math.sqrt(epsilonToKbA * epsilonToKbB);
  }
}
