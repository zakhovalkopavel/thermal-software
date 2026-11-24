/**
 * Unit tests for Yaws 1999 handbook equation methods.
 */

import { Equation } from '../../../../src/common/thermal/interfaces/equation.interface';
import { EquationTypeDto } from '../../../../src/common/thermal/dto/equation-type.dto';
import { Common } from '../../../../src/common/thermal/utils/common';
import { gaussLegendre20 } from '../../../../src/common/utils/quadrature';
import { YawsVaporPressureEquationMethod } from '../../../../src/common/thermal/utils/equation-methods/yaws-vapor-pressure-equation-method';
import { YawsLiquidViscosityEquationMethod } from '../../../../src/common/thermal/utils/equation-methods/yaws-liquid-viscosity-equation-method';
import { YawsLiquidConductivityEquationMethod } from '../../../../src/common/thermal/utils/equation-methods/yaws-liquid-conductivity-equation-method';
import { YawsLiquidDensityEquationMethod } from '../../../../src/common/thermal/utils/equation-methods/yaws-liquid-density-equation-method';
import { YawsWaterSolubilityEquationMethod } from '../../../../src/common/thermal/utils/equation-methods/yaws-water-solubility-equation-method';

const MMHG_TO_PA = 133.322387415;

function expectRelClose(actual: number, expected: number, tol = 1e-10): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tol * Math.max(Math.abs(expected), 1e-300));
}

function expectConsistent<T>(
  m: Equation<T>, vars: T, min: number, max: number, x1: number, x2: number, k = 1, tol = 1e-9,
): void {
  const delta = m.integral(x2, vars, min, max, k) - m.integral(x1, vars, min, max, k);
  expectRelClose(delta, gaussLegendre20(t => m.calculate(t, vars, min, max, k), x1, x2), tol);
  expectRelClose(m.calculateAverage(x1, x2, vars, min, max, k), delta / (x2 - x1), 1e-9);
  expect(m.calculateAverage(x1, x1, vars, min, max, k)).toBe(m.calculate(x1, vars, min, max, k));
}

describe('YawsVaporPressureEquationMethod', () => {
  const m = new YawsVaporPressureEquationMethod();
  // Table 7-1 BROMOCHLORODIFLUOROMETHANE
  const vars = { a: 27.6647, b: -1906.3, c: -7.4195, d: -3.7276e-11, e: 4.5327e-06 };

  it('matches log10(P/mmHg) → Pa at 298.15 K', () => {
    const T = 298.15;
    const log10P = vars.a + vars.b / T + vars.c * Math.log10(T) + vars.d * T + vars.e * T * T;
    expectRelClose(m.calculate(T, vars, 114, 426.15, MMHG_TO_PA), Math.pow(10, log10P) * MMHG_TO_PA);
  });

  it('integral and average are consistent', () => {
    expectConsistent(m, vars, 114, 426.15, 200, 300, MMHG_TO_PA);
  });
});

describe('YawsLiquidViscosityEquationMethod', () => {
  const m = new YawsLiquidViscosityEquationMethod();
  const vars = { a: -5.3203, b: 525.67, c: 0.018649, d: -2.767e-05 };

  it('matches printed 25 °C viscosity (cP → Pa·s)', () => {
    const T = 298.15;
    const log10Mu = vars.a + vars.b / T + vars.c * T + vars.d * T * T;
    expectRelClose(m.calculate(T, vars, 160, 426, 1e-3), Math.pow(10, log10Mu) * 1e-3, 1e-6);
  });

  it('integral and average are consistent', () => {
    expectConsistent(m, vars, 160, 426, 200, 300, 1e-3);
  });
});

describe('YawsLiquidConductivityEquationMethod', () => {
  const m = new YawsLiquidConductivityEquationMethod();
  const vars = { a: -1.1059, b: 0.232, c: 426.15 };

  it('matches log10(k) form at 298.15 K', () => {
    const T = 298.15;
    const expected = Math.pow(10, vars.a + vars.b * Math.pow(1 - T / vars.c, 2 / 7));
    expectRelClose(m.calculate(T, vars, 114, 405), expected, 1e-12);
  });

  it('integral and average are consistent', () => {
    expectConsistent(m, vars, 114, 405, 200, 300);
  });
});

describe('YawsLiquidDensityEquationMethod', () => {
  const m = new YawsLiquidDensityEquationMethod();
  const vars = { a: 0.67201, b: 0.25624, n: 0.2644, Tc: 426.15 };

  it('matches g/ml → kg/m³ at 298.15 K', () => {
    const T = 298.15;
    const rho = vars.a * Math.pow(vars.b, -Math.pow(1 - T / vars.Tc, vars.n));
    expectRelClose(m.calculate(T, vars, 113.65, 426.15, 1000), rho * 1000, 1e-12);
  });

  it('returns a·k at and above Tc', () => {
    expect(m.calculate(426.15, vars, 113.65, 500, 1000)).toBe(vars.a * 1000);
    expect(m.calculate(500, vars, 113.65, 500, 1000)).toBe(vars.a * 1000);
  });

  it('integral and average are consistent', () => {
    expectConsistent(m, vars, 113.65, 426.15, 200, 300, 1000);
  });
});

describe('YawsWaterSolubilityEquationMethod', () => {
  const m = new YawsWaterSolubilityEquationMethod();
  const vars = { a: 8.665, b: -3850.808, c: 573770.0 };

  it('matches ppm wt → mass fraction at 298.15 K', () => {
    const T = 298.15;
    const S = Math.pow(10, vars.a + vars.b / T + vars.c / (T * T));
    expectRelClose(m.calculate(T, vars, 273, 373, 1e-6), S * 1e-6, 1e-9);
  });

  it('integral and average are consistent', () => {
    expectConsistent(m, vars, 273, 373, 290, 330, 1e-6);
  });
});

describe('Common.equation dispatch (Yaws)', () => {
  it.each([
    [EquationTypeDto.yawsVaporPressure, YawsVaporPressureEquationMethod],
    [EquationTypeDto.yawsLiquidViscosity, YawsLiquidViscosityEquationMethod],
    [EquationTypeDto.yawsLiquidConductivity, YawsLiquidConductivityEquationMethod],
    [EquationTypeDto.yawsLiquidDensity, YawsLiquidDensityEquationMethod],
    [EquationTypeDto.yawsWaterSolubility, YawsWaterSolubilityEquationMethod],
  ])('%s → %p', (type, cls) => {
    expect(Common.equation(type)).toBeInstanceOf(cls);
  });
});
