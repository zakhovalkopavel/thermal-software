/**
 * Unit tests for MaierKelleyEquationMethod.
 *
 * f(T) = a + b·T + d/T²
 *   exact integral:  F(T) = a·T + b·T²/2 − d/T
 */

import { MaierKelleyEquationMethod }
  from '../../../../src/common/thermal/utils/equation-methods/maier-kelley-equation-method';

describe('MaierKelleyEquationMethod', () => {
  const m = new MaierKelleyEquationMethod();
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
