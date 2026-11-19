import { ChapmanEnskogDiffusion } from '../../../../src/modules/thermodynamics/utils/viscosity/chapman-enskog-diffusion';
import { LennardJonesCombining } from '../../../../src/modules/thermodynamics/utils/chapman-enskog/lennard-jones-combining';

describe('ChapmanEnskogDiffusion', () => {
  // Poling table LJ: N2 σ=3.798 Å ε/k=71.4; O2 σ=3.467 Å ε/k=106.7
  const M_N2 = 0.028014;
  const M_O2 = 0.031999;
  const sigmaN2 = 3.798;
  const sigmaO2 = 3.467;
  const epsN2 = 71.4;
  const epsO2 = 106.7;

  it('uses Lorentz–Berthelot combining', () => {
    expect(LennardJonesCombining.sigma12(sigmaN2, sigmaO2)).toBeCloseTo(3.6325, 4);
    expect(LennardJonesCombining.epsilon12(epsN2, epsO2))
      .toBeCloseTo(Math.sqrt(epsN2 * epsO2), 10);
  });

  it('N2–O2 D at 300 K, 1 atm is in the literature band (~0.20 cm²/s)', () => {
    const D = ChapmanEnskogDiffusion.binary(
      M_N2, M_O2, sigmaN2, sigmaO2, epsN2, epsO2, 300, 1,
    );
    // ~2.0e-5 m²/s = 0.20 cm²/s; allow a generous order band.
    expect(D).toBeGreaterThan(1.5e-5);
    expect(D).toBeLessThan(2.6e-5);
  });

  it('scales as 1/P', () => {
    const D1 = ChapmanEnskogDiffusion.binary(
      M_N2, M_O2, sigmaN2, sigmaO2, epsN2, epsO2, 300, 1,
    );
    const D2 = ChapmanEnskogDiffusion.binary(
      M_N2, M_O2, sigmaN2, sigmaO2, epsN2, epsO2, 300, 2,
    );
    expect(D2).toBeCloseTo(D1 / 2, 12);
  });

  it('rejects non-positive pressure', () => {
    expect(() => ChapmanEnskogDiffusion.binary(
      M_N2, M_O2, sigmaN2, sigmaO2, epsN2, epsO2, 300, 0,
    )).toThrow(/P_atm > 0/);
  });
});
