/**
 * Unit tests for AlyLeeEquationMethod (DIPPR Equation 107).
 *
 * Cp = c1 + c2·[c3/T / sinh(c3/T)]² + c4·[c5/T / cosh(c5/T)]²
 *
 * Exact antiderivative (ref: WolframAlpha):
 *   F(T) = c1·T + c2·c3·coth(c3/T) − c4·c5·tanh(c5/T)
 *
 * Verifies:
 *   - calculate() against known CO2 value at 300 K and 1000 K
 *   - integral() matches the exact closed-form formula
 *   - calculateAverage() is consistent with integral difference
 *   - antiderivative derivative (FD) equals calculate
 *   - N2 Aly-Lee at 300 K ≈ 29 J/(mol·K) (Perry7, k=1e-3)
 *   - clamping behaviour
 */

import { AlyLeeEquationMethod } from '../../../../src/common/thermal/utils/aly-lee-equation-method';

describe('AlyLeeEquationMethod', () => {
  const m = new AlyLeeEquationMethod();

  // CO2 Aly–Lee coefficients from Perry7 p.223 (k=1e-3 converts J/kmol·K → J/mol·K)
  const co2 = { c1: 0.2937e5, c2: 0.3454e5, c3: 1.428e3, c4: 0.264e5, c5: 588 };
  const k = 1e-3;

  it('calculate at 300 K with k=1e-3 — CO2 Cp ≈ 37 J/(mol·K)', () => {
    const cp = m.calculate(300, co2, 50, 5000, k);
    expect(cp).toBeGreaterThan(35);
    expect(cp).toBeLessThan(39);
  });

  it('calculate at 1000 K with k=1e-3 — CO2 Cp ≈ 54 J/(mol·K)', () => {
    const cp = m.calculate(1000, co2, 50, 5000, k);
    expect(cp).toBeGreaterThan(50);
    expect(cp).toBeLessThan(58);
  });

  it('integral matches exact closed-form at 500 K', () => {
    const T = 500;
    const { c1, c2, c3, c4, c5 } = co2;
    // F(T) = c1·T + c2·c3·coth(c3/T) − c4·c5·tanh(c5/T)
    const expected = (c1 * T + c2 * c3 / Math.tanh(c3 / T) - c4 * c5 * Math.tanh(c5 / T)) * k;
    expect(m.integral(T, co2, 50, 5000, k)).toBeCloseTo(expected, 6);
  });

  it('integral derivative equals calculate (finite difference)', () => {
    const h = 1e-4;
    const T = 700;
    const dI = (m.integral(T + h, co2, 50, 5000, k) - m.integral(T - h, co2, 50, 5000, k)) / (2 * h);
    expect(dI).toBeCloseTo(m.calculate(T, co2, 50, 5000, k), 4);
  });

  it('calculateAverage matches (F(T2)−F(T1))/(T2−T1)', () => {
    const avg = m.calculateAverage(300, 1000, co2, 50, 5000, k);
    const manual =
      (m.integral(1000, co2, 50, 5000, k) - m.integral(300, co2, 50, 5000, k)) / (1000 - 300);
    expect(avg).toBeCloseTo(manual, 10);
  });

  // N2 Aly–Lee from Perry7 p.223
  const n2 = { c1: 0.2911e5, c2: 0.0861e5, c3: 1.7016e3, c4: 0.001e5, c5: 909.79 };

  it('N2 Cp at 300 K ≈ 29.1 J/(mol·K)', () => {
    const cp = m.calculate(300, n2, 50, 1500, 1e-3);
    expect(cp).toBeGreaterThan(28.5);
    expect(cp).toBeLessThan(30);
  });

  it('clamps T below min to min', () => {
    expect(m.calculate(10, co2, 50, 5000, k)).toBeCloseTo(m.calculate(50, co2, 50, 5000, k), 10);
  });

  it('clamps T above max to max', () => {
    expect(m.calculate(9000, co2, 50, 5000, k)).toBeCloseTo(m.calculate(5000, co2, 50, 5000, k), 10);
  });

  it('integral at higher T is larger than at lower T (Cp > 0)', () => {
    expect(m.integral(1000, co2, 50, 5000, k)).toBeGreaterThan(m.integral(300, co2, 50, 5000, k));
  });

  it('CH4 Aly–Lee at 500 K is physically reasonable (30–70 J/(mol·K))', () => {
    const ch4 = { c1: 0.1925e5, c2: 0.5176e5, c3: 1.7019e3, c4: 0.3189e5, c5: 757.87 };
    const cp = m.calculate(500, ch4, 50, 1500, 1e-3);
    expect(cp).toBeGreaterThan(30);
    expect(cp).toBeLessThan(70);
  });
});

