import { NeufeldCollisionIntegrals } from '../../../../src/modules/thermodynamics/utils/chapman-enskog/neufeld-collision-integrals';
import { NEUFELD_COLLISION_INTEGRALS } from '../../../../src/modules/thermodynamics/constants/neufeld-collision-integrals.constants';

describe('NeufeldCollisionIntegrals', () => {
  /** Hand-evaluate Ω_D at T*=1 from published coefficients. */
  function omegaDHand(Tstar: number): number {
    const { A, B, C, D, E, F, G, H } = NEUFELD_COLLISION_INTEGRALS.OMEGA_D;
    return A / Math.pow(Tstar, B)
      + C / Math.exp(D * Tstar)
      + E / Math.exp(F * Tstar)
      + G / Math.exp(H * Tstar);
  }

  function omegaVHand(Tstar: number): number {
    const { A, B, C, D, E, F } = NEUFELD_COLLISION_INTEGRALS.OMEGA_V;
    return A / Math.pow(Tstar, B)
      + C / Math.exp(D * Tstar)
      + E / Math.exp(F * Tstar);
  }

  it('matches Neufeld Ω_D golden values', () => {
    expect(NeufeldCollisionIntegrals.omegaD(1)).toBeCloseTo(omegaDHand(1), 10);
    expect(NeufeldCollisionIntegrals.omegaD(1)).toBeCloseTo(1.439, 2);
    expect(NeufeldCollisionIntegrals.omegaD(5)).toBeCloseTo(omegaDHand(5), 10);
    expect(NeufeldCollisionIntegrals.omegaD(10)).toBeCloseTo(0.742, 2);
  });

  it('matches Neufeld Ω_v golden values', () => {
    expect(NeufeldCollisionIntegrals.omegaV(1)).toBeCloseTo(omegaVHand(1), 10);
    expect(NeufeldCollisionIntegrals.omegaV(1)).toBeCloseTo(1.593, 2);
    expect(NeufeldCollisionIntegrals.omegaV(5)).toBeCloseTo(omegaVHand(5), 10);
    expect(NeufeldCollisionIntegrals.omegaV(10)).toBeCloseTo(0.824, 2);
  });

  it('rejects non-positive T*', () => {
    expect(() => NeufeldCollisionIntegrals.omegaD(0)).toThrow(/T\* > 0/);
    expect(() => NeufeldCollisionIntegrals.omegaV(-1)).toThrow(/T\* > 0/);
  });
});
