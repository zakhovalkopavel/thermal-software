import { ChapmanEnskogViscosity } from '../../../../src/modules/thermodynamics/utils/viscosity/chapman-enskog-viscosity';
import { CHAPMAN_ENSKOG } from '../../../../src/modules/thermodynamics/constants/chapman-enskog.constants';
import { NeufeldCollisionIntegrals } from '../../../../src/modules/thermodynamics/utils/chapman-enskog/neufeld-collision-integrals';

describe('ChapmanEnskogViscosity', () => {
  // Poling N2 LJ: σ = 3.798 Å, ε/k = 71.4 K, M = 28.014 g/mol
  const M_N2 = 0.028014;
  const sigma_N2 = 3.798;
  const eps_N2 = 71.4;

  it('CE LJ μ for N2 at 300 K is near literature (~17.9 μPa·s)', () => {
    const mu = ChapmanEnskogViscosity.viscosity(M_N2, 300, sigma_N2, eps_N2, 0);
    // Literature dilute N2 ≈ 1.78e-5 Pa·s; CE LJ is typically within ~10 %.
    expect(mu).toBeGreaterThan(1.5e-5);
    expect(mu).toBeLessThan(2.1e-5);
  });

  it('Stockmayer δ raises Ω_v and lowers μ vs LJ', () => {
    const T = 300;
    const delta = 0.65;
    const muLj = ChapmanEnskogViscosity.viscosity(0.017031, T, 2.9, 558.3, 0);
    const muSt = ChapmanEnskogViscosity.viscosity(0.017031, T, 2.9, 558.3, delta);
    const Tstar = T / 558.3;
    const omegaLj = NeufeldCollisionIntegrals.omegaV(Tstar);
    const omegaSt = omegaLj
      + CHAPMAN_ENSKOG.STOCKMAYER_OMEGA_V_COEFF * delta * delta / Tstar;
    expect(omegaSt).toBeGreaterThan(omegaLj);
    expect(muSt).toBeLessThan(muLj);
  });

  it('isPolar uses stockmayerDelta or significant dipole', () => {
    expect(ChapmanEnskogViscosity.isPolar(0.65, undefined)).toBe(true);
    expect(ChapmanEnskogViscosity.isPolar(0, undefined)).toBe(false);
    // 1 Debye ≈ 3.33564e-30 C·m
    const oneDebye = 3.33564e-30;
    expect(ChapmanEnskogViscosity.isPolar(undefined, oneDebye)).toBe(true);
    expect(ChapmanEnskogViscosity.isPolar(undefined, 0.01 * oneDebye)).toBe(false);
  });

  it('fromCompound prefers stockmayerDelta and labels Stockmayer', () => {
    const r = ChapmanEnskogViscosity.fromCompound(
      {
        name: 'ammonia',
        chemicalFormula: 'NH3',
        Mr: 0.017031,
        collisionDiameter: 2.9,
        epsilonToKb: 558.3,
        stockmayerDelta: 0.65,
        viscosity: { def: 0, values: [] },
        thermalConductivity: { def: 0, values: [] },
      },
      300,
    );
    expect(r.polar).toBe(true);
    expect(r.message).toMatch(/Stockmayer/);
    expect(r.value).toBeGreaterThan(0);
  });
});
