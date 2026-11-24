import { NEUFELD_COLLISION_INTEGRALS } from '../../constants/neufeld-collision-integrals.constants';

/**
 * Neufeld et al. (1972) reduced collision integrals for LJ gases.
 * Refs: [Poling5], Neufeld / Poling Appendix.
 */
export class NeufeldCollisionIntegrals {
  /** Ω^(1,1)* for diffusion [-]. */
  static omegaD(Tstar: number): number {
    if (!(Tstar > 0)) throw new Error(`Neufeld Ω_D requires T* > 0, got ${Tstar}`);
    const { A, B, C, D, E, F, G, H } = NEUFELD_COLLISION_INTEGRALS.OMEGA_D;
    return A / Math.pow(Tstar, B)
      + C / Math.exp(D * Tstar)
      + E / Math.exp(F * Tstar)
      + G / Math.exp(H * Tstar);
  }

  /** Ω^(2,2)* for viscosity [-]. */
  static omegaV(Tstar: number): number {
    if (!(Tstar > 0)) throw new Error(`Neufeld Ω_v requires T* > 0, got ${Tstar}`);
    const { A, B, C, D, E, F } = NEUFELD_COLLISION_INTEGRALS.OMEGA_V;
    return A / Math.pow(Tstar, B)
      + C / Math.exp(D * Tstar)
      + E / Math.exp(F * Tstar);
  }
}
