/**
 * Unit tests for the gas transport equation methods (White3 Eqs. 1-35/1-36, 1-44a/b): sutherland, powerLaw.
 *
 * Verifies:
 *   - calculate() at reference points (air viscosity) and y(T0) = y0
 *   - closed-form integral() against reference values and Gauss–Legendre quadrature
 *   - calculateAverage() = Δintegral / ΔT, and = calculate() when T1 = T2
 *   - clamping and the n = −1 power-law special case
 */

import { Equation } from '../../../../src/common/thermal/interfaces/equation.interface';
import { EquationTypeDto } from '../../../../src/common/thermal/dto/equation-type.dto';
import { Common } from '../../../../src/common/thermal/utils/common';
import { gaussLegendre20 } from '../../../../src/common/utils/quadrature';
import { SutherlandEquationMethod } from '../../../../src/common/thermal/utils/equation-methods/sutherland-equation-method';
import { PowerLawEquationMethod } from '../../../../src/common/thermal/utils/equation-methods/power-law-equation-method';

function expectRelClose(actual: number, expected: number, tol = 1e-10): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tol * Math.max(Math.abs(expected), 1e-300));
}

/** Δintegral matches quadrature of calculate() and calculateAverage() matches Δintegral / ΔT. */
function expectConsistent<T>(m: Equation<T>, vars: T, min: number, max: number, x1: number, x2: number): void {
  const delta = m.integral(x2, vars, min, max) - m.integral(x1, vars, min, max);
  expectRelClose(delta, gaussLegendre20(t => m.calculate(t, vars, min, max), x1, x2), 1e-12);
  expectRelClose(m.calculateAverage(x1, x2, vars, min, max), delta / (x2 - x1), 1e-12);
  expect(m.calculateAverage(x1, x1, vars, min, max)).toBe(m.calculate(x1, vars, min, max));
}

describe('SutherlandEquationMethod', () => {
  const m = new SutherlandEquationMethod();
  // White3 Table 1-2: air viscosity, Pa·s
  const air = { y0: 1.716e-5, T0: 273, S: 111 };

  it('returns y0 at T0', () => {
    expectRelClose(m.calculate(273, air, 170, 1900), 1.716e-5, 1e-14);
  });

  it('air viscosity at 400 K matches the reference', () => {
    expectRelClose(m.calculate(400, air, 170, 1900), 2.2870392825210138e-5);
  });

  it('integral 300 → 500 K matches the reference', () => {
    expectRelClose(m.integral(500, air, 170, 1900) - m.integral(300, air, 170, 1900), 0.004556162304455864);
  });

  it('integral and average are consistent with calculate', () => {
    expectConsistent(m, air, 170, 1900, 300, 1500);
  });

  it('clamps to the valid range', () => {
    expect(m.calculate(3000, air, 170, 1900)).toBe(m.calculate(1900, air, 170, 1900));
  });
});

describe('PowerLawEquationMethod', () => {
  const m = new PowerLawEquationMethod();
  // White3 Table 1-2: air viscosity, Pa·s
  const air = { y0: 1.716e-5, T0: 273, n: 0.666 };

  it('returns y0 at T0', () => {
    expect(m.calculate(273, air, 210, 1900)).toBe(1.716e-5);
  });

  it('air viscosity at 400 K matches the reference', () => {
    expectRelClose(m.calculate(400, air, 210, 1900), 2.2131197548169116e-5);
  });

  it('integral 300 → 500 K matches the reference', () => {
    expectRelClose(m.integral(500, air, 210, 1900) - m.integral(300, air, 210, 1900), 0.004415881357539366);
  });

  it('integral and average are consistent with calculate', () => {
    expectConsistent(m, air, 210, 1900, 300, 1500);
  });

  it('handles n = −1', () => {
    expectConsistent(m, { ...air, n: -1 }, 210, 1900, 300, 1500);
  });
});

describe('Common.equation dispatch (gas transport)', () => {
  it.each([
    [EquationTypeDto.sutherland, SutherlandEquationMethod],
    [EquationTypeDto.powerLaw, PowerLawEquationMethod],
  ])('%s → %p', (type, cls) => {
    expect(Common.equation(type)).toBeInstanceOf(cls);
  });
});
