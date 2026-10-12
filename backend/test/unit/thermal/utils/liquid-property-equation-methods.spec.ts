/**
 * Unit tests for the liquid / saturation property equation methods added with the compound-data dataset:
 * dipprN101, ppds9, ppds10, ppds12, dipprN106, wagner25.
 *
 * Reference values were computed with the `chemicals` reference implementations
 * (EQ101, PPDS9, volume_VDI_PPDS, PPDS12, EQ106, Wagner).
 *
 * Verifies:
 *   - calculate() at reference points, k scaling and clamping
 *   - integral() consistency with calculate() (closed form or Gauss–Legendre from min / 298.15 K)
 *   - calculateAverage() = Δintegral / ΔT, and = calculate() when T1 = T2
 *   - behaviour at and above Tc
 */

import { Equation } from '../../../../src/common/thermal/interfaces/equation.interface';
import { EquationTypeDto } from '../../../../src/common/thermal/dto/equation-type.dto';
import { Common } from '../../../../src/common/thermal/utils/common';
import { gaussLegendre20 } from '../../../../src/common/utils/quadrature';
import { DipprEquation101Method } from '../../../../src/common/thermal/utils/equation-methods/dippr-equation-101-method';
import { Ppds9EquationMethod } from '../../../../src/common/thermal/utils/equation-methods/ppds9-equation-method';
import { Ppds10EquationMethod } from '../../../../src/common/thermal/utils/equation-methods/ppds10-equation-method';
import { Ppds12EquationMethod } from '../../../../src/common/thermal/utils/equation-methods/ppds12-equation-method';
import { DipprEquation106Method } from '../../../../src/common/thermal/utils/equation-methods/dippr-equation-106-method';
import { Wagner25EquationMethod } from '../../../../src/common/thermal/utils/equation-methods/wagner25-equation-method';

function expectRelClose(actual: number, expected: number, tol = 1e-10): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tol * Math.max(Math.abs(expected), 1e-300));
}

/** Δintegral matches quadrature of calculate() and calculateAverage() matches Δintegral / ΔT. */
function expectConsistent<T>(
  m: Equation<T>, vars: T, min: number, max: number, x1: number, x2: number, k = 1, tol = 1e-9,
): void {
  const delta = m.integral(x2, vars, min, max, k) - m.integral(x1, vars, min, max, k);
  expectRelClose(delta, gaussLegendre20(t => m.calculate(t, vars, min, max, k), x1, x2), tol);
  expectRelClose(m.calculateAverage(x1, x2, vars, min, max, k), delta / (x2 - x1), 1e-9);
  expect(m.calculateAverage(x1, x1, vars, min, max, k)).toBe(m.calculate(x1, vars, min, max, k));
}

describe('DipprEquation101Method', () => {
  const m = new DipprEquation101Method();
  // Perry8 water vapour pressure, Pa
  const water = { c1: 73.649, c2: -7258.2, c3: -7.3037, c4: 4.1653e-6, c5: 2 };

  it('water vapour pressure at 300 K matches the reference', () => {
    expectRelClose(m.calculate(300, water, 273.16, 647.1), 3537.44834545549);
  });

  it('k scales the result', () => {
    expectRelClose(m.calculate(300, water, 273.16, 647.1, 1e-3), 3.53744834545549);
  });

  it('integral starts at min, or at 298.15 K when min is unbounded', () => {
    expect(m.integral(273.16, water, 273.16, 647.1)).toBe(0);
    expect(m.integral(298.15, water, -Infinity, Infinity)).toBe(0);
  });

  it('integral and average are consistent with calculate', () => {
    expectConsistent(m, water, 273.16, 647.1, 300, 350);
  });
});

describe('Ppds9EquationMethod', () => {
  const m = new Ppds9EquationMethod();
  const vars = { a: 1.74793, b: 1.33728, c: 482.347, d: 41.78, e: 9.963e-5 };

  it('liquid viscosity at 400 K matches the reference', () => {
    expectRelClose(m.calculate(400, vars, 200, 480), 0.00035091137378230684);
  });

  it('decreases with temperature', () => {
    expect(m.calculate(300, vars, 200, 480)).toBeGreaterThan(m.calculate(400, vars, 200, 480));
  });

  it('integral and average are consistent with calculate', () => {
    expectConsistent(m, vars, 200, 480, 300, 330);
  });
});

describe('Ppds10EquationMethod', () => {
  const m = new Ppds10EquationMethod();
  const n2 = { Tc: 126.19, rhoc: 313, a: 470.922, b: 493.251, c: -560.469, d: 389.611 };
  const ethanol = { Tc: 513.9, rhoc: 276, a: 748.617, b: -412.3622, c: 776.4394, d: -436.6757 };

  it('ethanol liquid density at 300 K matches the reference', () => {
    expectRelClose(m.calculate(300, ethanol, 160, 513.9), 784.4306495995434);
  });

  it('returns ρc at and above Tc', () => {
    expect(m.calculate(300, n2, 63.15, 400)).toBe(313);
    expect(m.calculate(126.19, n2, 63.15, 400)).toBe(313);
  });

  it('integral and average are consistent below Tc', () => {
    expectConsistent(m, ethanol, 160, 513.9, 250, 400);
  });

  it('integral is continuous at Tc and grows by ρc above it', () => {
    const atTc = m.integral(126.19, n2, 63.15, 400);
    expectRelClose(m.integral(126.19 + 1e-9, n2, 63.15, 400), atTc, 1e-9);
    expectRelClose(m.integral(200, n2, 63.15, 400) - atTc, 313 * (200 - 126.19), 1e-12);
  });
});

describe('Ppds12EquationMethod', () => {
  const m = new Ppds12EquationMethod();
  // VDI2010 toluene enthalpy of vaporization, J/mol
  const toluene = { Tc: 591.75, a: 4.60584, b: 13.97224, c: -10.592315, d: 2.120205, e: 4.277128 };

  it('ΔHvap at 300 K matches the reference', () => {
    expectRelClose(m.calculate(300, toluene, 178, 591.75), 37948.76862035925);
  });

  it('is 0 at and above Tc and the integral stays constant there', () => {
    expect(m.calculate(591.75, toluene, 178, 700)).toBe(0);
    expect(m.calculate(650, toluene, 178, 700)).toBe(0);
    expect(m.integral(650, toluene, 178, 700)).toBe(m.integral(591.75, toluene, 178, 700));
  });

  it('integral and average are consistent with calculate', () => {
    expectConsistent(m, toluene, 178, 591.75, 250, 450);
  });
});

describe('DipprEquation106Method', () => {
  const m = new DipprEquation106Method();
  // VDI2010 water surface tension, N/m
  const water = { Tc: 647.096, c1: 0.17766, c2: 2.567, c3: -3.3377, c4: 1.9699, c5: 0 };

  it('water surface tension at 300 K matches the reference', () => {
    expectRelClose(m.calculate(300, water, 273.16, 647.096), 0.07231499373541);
  });

  it('is 0 at and above Tc', () => {
    expect(m.calculate(647.096, water, 273.16, 700)).toBe(0);
    expect(m.calculate(680, water, 273.16, 700)).toBe(0);
  });

  it('integral and average are consistent with calculate', () => {
    expectConsistent(m, water, 273.16, 647.096, 300, 400);
  });
});

describe('Wagner25EquationMethod', () => {
  const m = new Wagner25EquationMethod();
  // VDI2010 methane vapour pressure, Pa
  const methane = { Tc: 190.551, Pc: 4599200, a: -6.02242, b: 1.26652, c: -0.5707, d: -1.366 };

  it('methane vapour pressure at 100 K matches the reference', () => {
    expectRelClose(m.calculate(100, methane, 90.7, 190.551), 34415.004762637);
  });

  it('returns Pc at and above Tc', () => {
    expectRelClose(m.calculate(190.551, methane, 90.7, 250), 4599200, 1e-14);
    expectRelClose(m.calculate(220, methane, 90.7, 250), 4599200, 1e-14);
  });

  it('integral and average are consistent with calculate', () => {
    expectConsistent(m, methane, 90.7, 190.551, 100, 130);
  });
});

describe('Common.equation dispatch (liquid properties)', () => {
  it.each([
    [EquationTypeDto.dipprN101, DipprEquation101Method],
    [EquationTypeDto.ppds9, Ppds9EquationMethod],
    [EquationTypeDto.ppds10, Ppds10EquationMethod],
    [EquationTypeDto.ppds12, Ppds12EquationMethod],
    [EquationTypeDto.dipprN106, DipprEquation106Method],
    [EquationTypeDto.wagner25, Wagner25EquationMethod],
  ])('%s → %p', (type, cls) => {
    expect(Common.equation(type)).toBeInstanceOf(cls);
  });
});
