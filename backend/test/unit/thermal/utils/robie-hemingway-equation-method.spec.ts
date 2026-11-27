/**
 * Unit tests for RobieHemingwayEquationMethod.
 *
 * Cp = A1 + A2·T + A3/T² + A4/T^0.5 + A5·T²
 *   exact integral: F(T) = A1·T + A2·T²/2 − A3/T + 2·A4·√T + A5·T³/3
 *
 * Refs: [60] RobieHemingway1995
 */

import { EquationTypeDto } from '../../../../src/common/thermal/dto/equation-type.dto';
import { Common } from '../../../../src/common/thermal/utils/common';
import { RobieHemingwayEquationMethod }
  from '../../../../src/common/thermal/utils/equation-methods/robie-hemingway-equation-method';

describe('RobieHemingwayEquationMethod', () => {
  const m = new RobieHemingwayEquationMethod();
  // Corundum A1–A5 from Robie & Hemingway 1995 (staging)
  const range = {
    Tmin: 298,
    Tmax: 2250,
    A1: 161.2,
    A2: -0.001352,
    A3: -1815000.0,
    A4: -1059.0,
    A5: 5.381e-07,
  };
  const vars = { ranges: [range] };

  it('calculate at 500 K matches formula', () => {
    const T = 500;
    const expected =
      range.A1
      + range.A2 * T
      + range.A3 / (T * T)
      + range.A4 / Math.sqrt(T)
      + range.A5 * T * T;
    expect(m.calculate(T, vars, 298, 2250)).toBeCloseTo(expected, 8);
  });

  it('integral is cumulative from ranges[0].Tmin (closed form)', () => {
    const T = 800;
    const F = (t: number) =>
      range.A1 * t
      + range.A2 * t * t / 2
      - range.A3 / t
      + 2 * range.A4 * Math.sqrt(t)
      + range.A5 * Math.pow(t, 3) / 3;
    expect(m.integral(T, vars, 298, 2250)).toBeCloseTo(F(T) - F(298), 5);
  });

  it('integral derivative equals calculate (FD at 600 K)', () => {
    const h = 1e-4;
    const T = 600;
    const dI = (m.integral(T + h, vars, 298, 2250) - m.integral(T - h, vars, 298, 2250)) / (2 * h);
    expect(dI).toBeCloseTo(m.calculate(T, vars, 298, 2250), 4);
  });

  it('calculateAverage matches (F(800)−F(400))/400', () => {
    const avg = m.calculateAverage(400, 800, vars, 298, 2250);
    const manual = (m.integral(800, vars, 298, 2250) - m.integral(400, vars, 298, 2250)) / 400;
    expect(avg).toBeCloseTo(manual, 10);
  });

  it('clamps below min and above max', () => {
    expect(m.calculate(100, vars, 298, 2250)).toBeCloseTo(m.calculate(298, vars, 298, 2250), 10);
    expect(m.calculate(3000, vars, 298, 2250)).toBeCloseTo(m.calculate(2250, vars, 298, 2250), 10);
  });

  it('scaling factor k applied', () => {
    const raw = m.calculate(500, vars, 298, 2250);
    expect(m.calculate(500, vars, 298, 2250, 1e-3)).toBeCloseTo(raw * 1e-3, 12);
  });

  it('piecewise selects second range', () => {
    const multi = {
      ranges: [
        { ...range, Tmax: 1000 },
        { Tmin: 1000, Tmax: 2250, A1: 160, A2: 0, A3: 0, A4: 0, A5: 0 },
      ],
    };
    expect(m.calculate(1500, multi, 298, 2250)).toBeCloseTo(160, 10);
  });
});

describe('Common.equation dispatch (robieHemingway)', () => {
  it('robieHemingway → RobieHemingwayEquationMethod', () => {
    expect(Common.equation(EquationTypeDto.robieHemingway)).toBeInstanceOf(
      RobieHemingwayEquationMethod,
    );
  });
});
