/**
 * Unit tests for the heat-capacity equation methods added with the compound-data dataset:
 * dipprN114, trcCp, shomate, zabranskySpline, zabranskyQuasiPolynomial.
 *
 * Reference values were computed with the `chemicals` reference implementations
 * (EQ114, TRCCp, Shomate, Zabransky_cubic, Zabransky_quasi_polynomial and their integrals).
 *
 * Verifies:
 *   - calculate() at reference points, k scaling and clamping
 *   - integral() against reference values and Gauss–Legendre quadrature of calculate()
 *   - calculateAverage() = Δintegral / ΔT, and = calculate() when T1 = T2
 *   - piecewise continuity at range boundaries
 *   - RangeError at T ≥ Tc for the correlations that diverge there
 */

import { Equation } from '../../../../src/common/thermal/interfaces/equation.interface';
import { EquationTypeDto } from '../../../../src/common/thermal/dto/equation-type.dto';
import { Common } from '../../../../src/common/thermal/utils/common';
import { gaussLegendre20 } from '../../../../src/common/utils/quadrature';
import { DipprEquation114Method } from '../../../../src/common/thermal/utils/equation-methods/dippr-equation-114-method';
import { TrcCpEquationMethod } from '../../../../src/common/thermal/utils/equation-methods/trc-cp-equation-method';
import { ShomateEquationMethod } from '../../../../src/common/thermal/utils/equation-methods/shomate-equation-method';
import {
  ZabranskySplineEquationMethod,
} from '../../../../src/common/thermal/utils/equation-methods/zabransky-spline-equation-method';
import {
  ZabranskyQuasiPolynomialEquationMethod,
} from '../../../../src/common/thermal/utils/equation-methods/zabransky-quasi-polynomial-equation-method';

const R = 8.31446261815324;

function expectRelClose(actual: number, expected: number, tol = 1e-10): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tol * Math.max(Math.abs(expected), 1e-300));
}

/** Δintegral matches quadrature of calculate() and calculateAverage() matches Δintegral / ΔT. */
function expectConsistent<T>(
  m: Equation<T>, vars: T, min: number, max: number, x1: number, x2: number, k = 1, tol = 1e-9,
): void {
  const delta = m.integral(x2, vars, min, max, k) - m.integral(x1, vars, min, max, k);
  expectRelClose(delta, gaussLegendre20(t => m.calculate(t, vars, min, max, k), x1, x2), tol);
  expectRelClose(m.calculateAverage(x1, x2, vars, min, max, k), delta / (x2 - x1), 1e-12);
  expect(m.calculateAverage(x1, x1, vars, min, max, k)).toBe(m.calculate(x1, vars, min, max, k));
}

describe('DipprEquation114Method', () => {
  const m = new DipprEquation114Method();
  // Perry8 hydrogen liquid Cp, J/(kmol·K)
  const h2 = { Tc: 33.19, c1: 66.653, c2: 6765.9, c3: -123.63, c4: 478.27 };
  // Perry8 ammonia liquid Cp, J/(kmol·K); k = 1e-3 → J/(mol·K)
  const nh3 = { Tc: 405.65, c1: 61.289, c2: 80925, c3: 799.4, c4: -2651 };

  it('hydrogen at 20 K matches the reference', () => {
    expectRelClose(m.calculate(20, h2, 13.95, 32), 19423.948911676463);
  });

  it('ammonia at 300 K with k = 1e-3 matches the reference', () => {
    expectRelClose(m.calculate(300, nh3, 203.15, 401.15, 1e-3), 80.27593023628401);
  });

  it('ammonia integral 250 → 380 K matches the reference', () => {
    const delta = m.integral(380, nh3, 203.15, 401.15, 1e-3) - m.integral(250, nh3, 203.15, 401.15, 1e-3);
    expectRelClose(delta, 11600.336132643279);
  });

  it('integral and average are consistent with calculate', () => {
    expectConsistent(m, nh3, 203.15, 401.15, 250, 380, 1e-3);
  });

  it('clamps to the valid range', () => {
    expect(m.calculate(500, nh3, 203.15, 401.15)).toBe(m.calculate(401.15, nh3, 203.15, 401.15));
  });

  it('throws RangeError at and above Tc', () => {
    expect(() => m.calculate(33.19, h2, 13.95, 40)).toThrow(RangeError);
    expect(() => m.integral(35, h2, 13.95, 40)).toThrow(RangeError);
  });
});

describe('TrcCpEquationMethod', () => {
  const m = new TrcCpEquationMethod();
  const vars = { a0: 4.0, a1: 7.65e5, a2: 720, a3: 3.565, a4: -0.052, a5: -1.55e6, a6: 52, a7: 201, I: 0, J: 0 };

  it('Cp at 300 K with k = R matches the reference', () => {
    expectRelClose(m.calculate(300, vars, 50, 3000, R), 42.065271080974654);
  });

  it('integral at 298.15 K includes the I constant', () => {
    expectRelClose(m.integral(298.15, { ...vars, I: 1.2 }, 50, 3000, R), 10802.536262068485);
  });

  it('integral 100 → 1500 K matches the reference', () => {
    const delta = m.integral(1500, vars, 50, 3000, R) - m.integral(100, vars, 50, 3000, R);
    expectRelClose(delta, 71639.8596953338);
  });

  it('integral and average are consistent below and above a7', () => {
    expectConsistent(m, vars, 50, 3000, 100, 200, R);
    expectConsistent(m, vars, 50, 3000, 300, 1500, R);
  });

  it('is continuous at T = a7', () => {
    expectRelClose(m.calculate(201 + 1e-9, vars, 50, 3000), m.calculate(201, vars, 50, 3000), 1e-9);
    expectRelClose(m.integral(201 + 1e-9, vars, 50, 3000), m.integral(201, vars, 50, 3000), 1e-9);
  });

  it('handles a1 = 0 and a2 = 0', () => {
    const simple = { ...vars, a1: 0, a2: 0 };
    expectConsistent(m, simple, 50, 3000, 300, 1500);
    const noExp = { ...vars, a2: 0 };
    expectConsistent(m, noExp, 50, 3000, 300, 1500);
  });
});

describe('ShomateEquationMethod', () => {
  const m = new ShomateEquationMethod();
  // NIST WebBook water vapour, 500–1700 K (coefficients converted to T in K)
  const high = { Tmin: 500, Tmax: 1700, a: 30.092, b: 6.832514e-3, c: 6.793435e-6, d: -2.534480e-9, e: 0.082139e6 };
  const low = { Tmin: 298, Tmax: 500, a: 28.9, b: 1.2e-2, c: -3.0e-6, d: 1.0e-9, e: -0.05e6 };
  const water = { ranges: [high] };
  const piecewise = { ranges: [low, high] };

  it('water vapour Cp at 500 K matches the reference', () => {
    expectRelClose(m.calculate(500, water, 500, 1700), 35.21836175);
  });

  it('integral is cumulative from the first range Tmin', () => {
    expect(m.integral(500, water, 500, 1700)).toBe(0);
    const F = (T: number): number =>
      high.a * T + high.b * T * T / 2 + high.c * T ** 3 / 3 + high.d * T ** 4 / 4 - high.e / T;
    expectRelClose(F(500), 15979.244791666666);
    expectRelClose(m.integral(1000, water, 500, 1700), F(1000) - F(500));
  });

  it('integral and average are consistent within each range and across the boundary', () => {
    expectConsistent(m, piecewise, 298, 1700, 300, 480);
    expectConsistent(m, piecewise, 298, 1700, 600, 1600);
    const across = m.integral(1000, piecewise, 298, 1700) - m.integral(400, piecewise, 298, 1700);
    const quad = gaussLegendre20(t => m.calculate(t, piecewise, 298, 1700), 400, 500)
      + gaussLegendre20(t => m.calculate(t, piecewise, 298, 1700), 500, 1000);
    expectRelClose(across, quad, 1e-9);
  });

  it('integral is continuous at the range boundary', () => {
    expectRelClose(m.integral(500 + 1e-9, piecewise, 298, 1700), m.integral(500, piecewise, 298, 1700), 1e-9);
  });

  it('uses the last range above the highest Tmax when max is unbounded', () => {
    expect(m.calculate(2000, piecewise, 298, Infinity)).toBeCloseTo(
      high.a + high.b * 2000 + high.c * 2000 ** 2 + high.d * 2000 ** 3 + high.e / 2000 ** 2, 10,
    );
  });
});

describe('ZabranskySplineEquationMethod', () => {
  const m = new ZabranskySplineEquationMethod();
  const range = { Tmin: 0, Tmax: 1000, a1: 20.9634, a2: -10.1344, a3: 2.8253, a4: -0.256738 };
  const single = { ranges: [range] };

  it('Cp at 298.15 K with k = R matches the reference', () => {
    expectRelClose(m.calculate(298.15, single, 0, 1000, R), 75.31465144297);
  });

  it('integral at 298.15 K with k = R matches the reference', () => {
    expectRelClose(m.integral(298.15, single, 0, 1000, R), 31051.690370364566);
  });

  it('integral and average are consistent across two ranges', () => {
    const second = { Tmin: 350, Tmax: 500, a1: 21.0, a2: -10.0, a3: 2.8, a4: -0.25 };
    const piecewise = { ranges: [{ ...range, Tmax: 350 }, second] };
    expectConsistent(m, piecewise, 0, 500, 250, 340, R);
    expectConsistent(m, piecewise, 0, 500, 360, 480, R);
    expectRelClose(m.integral(350 + 1e-9, piecewise, 0, 500), m.integral(350, piecewise, 0, 500), 1e-9);
  });
});

describe('ZabranskyQuasiPolynomialEquationMethod', () => {
  const m = new ZabranskyQuasiPolynomialEquationMethod();
  const vars = { Tc: 591.79, a1: -3.12743, a2: 0.0857315, a3: 13.7282, a4: 1.28971, a5: 6.42297, a6: 4.10989 };

  it('Cp at 330 K with k = R matches the reference', () => {
    expectRelClose(m.calculate(330, vars, 180, 560, R), 165.472878778683);
  });

  it('integral 200 → 300 K with k = R matches the reference', () => {
    const delta = m.integral(300, vars, 180, 560, R) - m.integral(200, vars, 180, 560, R);
    expectRelClose(delta, 14662.031376528748);
  });

  it('integral and average are consistent with calculate', () => {
    expectConsistent(m, vars, 180, 560, 200, 550, R);
  });

  it('throws RangeError at and above Tc', () => {
    expect(() => m.calculate(591.79, vars, 180, 700)).toThrow(RangeError);
    expect(() => m.integral(600, vars, 180, 700)).toThrow(RangeError);
  });
});

describe('Common.equation dispatch (heat capacity)', () => {
  it.each([
    [EquationTypeDto.dipprN114, DipprEquation114Method],
    [EquationTypeDto.trcCp, TrcCpEquationMethod],
    [EquationTypeDto.shomate, ShomateEquationMethod],
    [EquationTypeDto.zabranskySpline, ZabranskySplineEquationMethod],
    [EquationTypeDto.zabranskyQuasiPolynomial, ZabranskyQuasiPolynomialEquationMethod],
  ])('%s → %p', (type, cls) => {
    expect(Common.equation(type)).toBeInstanceOf(cls);
  });
});
