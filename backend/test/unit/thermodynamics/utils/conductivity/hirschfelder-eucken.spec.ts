import { HirschfelderEucken } from '../../../../../src/modules/thermodynamics/utils/conductivity/hirschfelder-eucken';
import { PHYSICAL_CONSTANTS } from '../../../../../src/common/thermal/constants/physical.constants';
import { MIXTURE_THERMAL_CONDUCTIVITY } from '../../../../../src/modules/thermodynamics/constants/mixture-thermal-conductivity.constants';

describe('HirschfelderEucken', () => {
  const R = PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK;
  const fTr = MIXTURE_THERMAL_CONDUCTIVITY.TRANSLATIONAL_EUCKEN_FACTOR;

  it('recovers pure λ when one component has y=1', () => {
    const eta = 2e-5;
    const M = 0.028;
    const lambdaTr = fTr * (R / M) * eta;
    const lambda = lambdaTr + 0.01;
    const mix = HirschfelderEucken.mix([{ y: 1, lambda, eta, M }]);
    expect(mix).toBeCloseTo(lambda, 12);
  });

  it('differs from mole-fraction average for unequal M and λ', () => {
    const a = { y: 0.5, lambda: 0.03, eta: 1.8e-5, M: 0.028 };
    const b = { y: 0.5, lambda: 0.06, eta: 2.5e-5, M: 0.044 };
    const mix = HirschfelderEucken.mix([a, b]);
    const moleAvg = 0.5 * a.lambda + 0.5 * b.lambda;
    expect(mix).not.toBeCloseTo(moleAvg, 4);
    expect(mix).toBeGreaterThan(0.02);
    expect(mix).toBeLessThan(0.07);
  });

  it('returns 0 for empty species list', () => {
    expect(HirschfelderEucken.mix([])).toBe(0);
  });
});
