/**
 * Unit tests for LinearHyperbolicEquationMethod and
 * LinearHyperbolicLogarithmicEquationMethod.
 *
 * LinearHyperbolic:             f(T) = a + b·T + d/T²
 *   exact integral:  F(T) = a·T + b·T²/2 − d/T
 *
 * LinearHyperbolicLogarithmic:  f(T) = c1 + c2·ln T + c3/T + c4·T
 *   exact integral:  F(T) = c1·T + c2·(T·ln T − T) + c3·ln T + c4·T²/2
 *   ref: WolframAlpha
 */

import { LinearHyperbolicEquationMethod }
  from '../../../../src/common/thermal/utils/linear-hyperbolic-equation-method';
import { LinearHyperbolicLogarithmicEquationMethod }
  from '../../../../src/common/thermal/utils/linear-hyperbolic-logarithmic-equation-method';

// ─── LinearHyperbolicEquationMethod  f(T) = a + b·T + d/T² ──────────────────

describe('LinearHyperbolicEquationMethod', () => {
  const m = new LinearHyperbolicEquationMethod();
  // CO2 Cp from Szargut p.268: a=44.17, b=9.04e-3, d=-8.54e5
  const v = { a: 44.17, b: 9.04e-3, d: -8.54e5 };

  it('calculate at 500 K matches formula', () => {
    const T = 500;
    expect(m.calculate(T, v, 298, 2500)).toBeCloseTo(
      v.a + v.b * T + v.d / (T * T), 8,
    );
  });

  it('calculate at 1000 K is physically reasonable (40–55 J/(mol·K))', () => {
    const result = m.calculate(1000, v, 298, 2500);
    expect(result).toBeGreaterThan(40);
    expect(result).toBeLessThan(55);
  });

  it('integral: F(T) = a·T + b·T²/2 − d/T', () => {
    const T = 800;
    expect(m.integral(T, v, 298, 2500)).toBeCloseTo(
      v.a * T + v.b * T * T / 2 - v.d / T, 6,
    );
  });

  it('integral derivative equals calculate (FD at 600 K)', () => {
    const h = 1e-4;
    const T = 600;
    const dI = (m.integral(T + h, v, 298, 2500) - m.integral(T - h, v, 298, 2500)) / (2 * h);
    expect(dI).toBeCloseTo(m.calculate(T, v, 298, 2500), 5);
  });

  it('calculateAverage matches (F(800)−F(400))/400', () => {
    const avg    = m.calculateAverage(400, 800, v, 298, 2500);
    const manual = (m.integral(800, v, 298, 2500) - m.integral(400, v, 298, 2500)) / 400;
    expect(avg).toBeCloseTo(manual, 10);
  });

  it('clamps below min', () => {
    expect(m.calculate(100, v, 298, 2500)).toBeCloseTo(m.calculate(298, v, 298, 2500), 10);
  });

  it('clamps above max', () => {
    expect(m.calculate(3000, v, 298, 2500)).toBeCloseTo(m.calculate(2500, v, 298, 2500), 10);
  });

  it('scaling factor k=1e-3 applied', () => {
    const raw = m.calculate(500, v, 298, 2500);
    expect(m.calculate(500, v, 298, 2500, 1e-3)).toBeCloseTo(raw * 1e-3, 12);
  });

  it('exact: ∫₁² 4/x² dx = 2 (d/T² term)', () => {
    // F(T) = −d/T  →  F(2)−F(1) = −4/2 − (−4/1) = −2+4 = 2
    const vd = { a: 0, b: 0, d: 4 };
    expect(m.integral(2, vd, 0, 1000) - m.integral(1, vd, 0, 1000)).toBeCloseTo(2, 10);
  });
});

// ─── LinearHyperbolicLogarithmicEquationMethod  f = c1 + c2·lnT + c3/T + c4·T

describe('LinearHyperbolicLogarithmicEquationMethod', () => {
  const m = new LinearHyperbolicLogarithmicEquationMethod();
  const v = { c1: 3.0, c2: 0.5, c3: -100, c4: 2e-4 };

  it('calculate at 400 K matches formula', () => {
    const T = 400;
    expect(m.calculate(T, v, 100, 2000)).toBeCloseTo(
      v.c1 + v.c2 * Math.log(T) + v.c3 / T + v.c4 * T, 8,
    );
  });

  it('integral: F = c1·T + c2·(T·lnT−T) + c3·lnT + c4·T²/2 (ref WolframAlpha)', () => {
    const T = 500;
    const expected =
      v.c1 * T +
      v.c2 * (T * Math.log(T) - T) +
      v.c3 * Math.log(T) +
      v.c4 * T * T / 2;
    expect(m.integral(T, v, 100, 2000)).toBeCloseTo(expected, 6);
  });

  it('integral derivative equals calculate (FD at 700 K)', () => {
    const h = 1e-4;
    const T = 700;
    const dI = (m.integral(T + h, v, 100, 2000) - m.integral(T - h, v, 100, 2000)) / (2 * h);
    expect(dI).toBeCloseTo(m.calculate(T, v, 100, 2000), 5);
  });

  it('calculateAverage matches (F(700)−F(300))/400', () => {
    const avg    = m.calculateAverage(300, 700, v, 100, 2000);
    const manual = (m.integral(700, v, 100, 2000) - m.integral(300, v, 100, 2000)) / 400;
    expect(avg).toBeCloseTo(manual, 10);
  });

  it('exact: ∫₁ᵉ ln(x) dx = 1', () => {
    // [x·lnx − x]₁ᵉ = (e·1−e) − (0−1) = 1
    const vln = { c1: 0, c2: 1, c3: 0, c4: 0 };
    const result = m.integral(Math.E, vln, 0, 1e6) - m.integral(1, vln, 0, 1e6);
    expect(result).toBeCloseTo(1.0, 10);
  });

  it('scaling factor k=2 applied', () => {
    const raw = m.calculate(400, v, 100, 2000);
    expect(m.calculate(400, v, 100, 2000, 2)).toBeCloseTo(raw * 2, 10);
  });
});

