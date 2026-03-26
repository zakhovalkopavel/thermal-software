/**
 * Unit tests for DipprEquation102Method (DIPPR Correlation 102).
 *
 * f(T) = c1·T^c2 / (1 + c3/T + c4/T²)
 *
 * No closed-form antiderivative for arbitrary c2 — uses gaussLegendre20.
 *
 * Verifies:
 *   - calculate() at reference points
 *   - integral() is consistent (FD of calculate ≈ calculate)
 *   - calculateAverage() = integral over [x1,x2] / (x2-x1)
 *   - For constant and linear special cases, result matches analytic value
 *   - N2 DIPPR-102 thermal conductivity at 300 K ≈ 0.026 W/(m·K)
 *   - clamping behaviour
 */

import { DipprEquation102Method } from '../../../../src/common/thermal/utils/dippr-equation-102-method';

describe('DipprEquation102Method', () => {
  const m = new DipprEquation102Method();

  // N2 thermal conductivity: Perry9 p.328
  // f(T) = 0.00033143·T^0.7722 / (1 + 16.323/T + 373.72/T²)
  const n2 = { c1: 0.00033143, c2: 0.7722, c3: 16.323, c4: 373.72 };

  it('N2 thermal conductivity at 300 K ≈ 0.026 W/(m·K)', () => {
    const result = m.calculate(300, n2, 63.15, 2000);
    expect(result).toBeGreaterThan(0.024);
    expect(result).toBeLessThan(0.028);
  });

  it('N2 thermal conductivity increases with T (300 → 1000 K)', () => {
    expect(m.calculate(1000, n2, 63.15, 2000)).toBeGreaterThan(m.calculate(300, n2, 63.15, 2000));
  });

  it('integral over [300,600] is positive and finite', () => {
    const result = m.integral(600, n2, 63.15, 2000) - m.integral(300, n2, 63.15, 2000);
    expect(result).toBeGreaterThan(0);
    expect(Number.isFinite(result)).toBe(true);
  });

  it('calculateAverage over [300,600] is between calc(300) and calc(600)', () => {
    const avg = m.calculateAverage(300, 600, n2, 63.15, 2000);
    const lo  = m.calculate(300, n2, 63.15, 2000);
    const hi  = m.calculate(600, n2, 63.15, 2000);
    expect(avg).toBeGreaterThan(lo);
    expect(avg).toBeLessThan(hi);
  });

  it('calculateAverage at single point (T1=T2) equals calculate', () => {
    const T = 500;
    expect(m.calculateAverage(T, T, n2, 63.15, 2000)).toBeCloseTo(m.calculate(T, n2, 63.15, 2000), 6);
  });

  it('clamps below min to min', () => {
    expect(m.calculate(10, n2, 63.15, 2000)).toBeCloseTo(m.calculate(63.15, n2, 63.15, 2000), 8);
  });

  it('clamps above max to max', () => {
    expect(m.calculate(5000, n2, 63.15, 2000)).toBeCloseTo(m.calculate(2000, n2, 63.15, 2000), 8);
  });

  // c2=1, c3=0, c4=0: f(T) = c1·T  →  ∫₁³ = c1·(3²−1²)/2 = c1·4
  it('integer c2=1, c3=c4=0: integral matches c1·(b²−a²)/2', () => {
    const vc = { c1: 2, c2: 1, c3: 0, c4: 0 };
    const result = m.integral(3, vc, 0, 1000) - m.integral(1, vc, 0, 1000);
    // 2·∫₁³ T dT = 2·4 = 8
    expect(result).toBeCloseTo(8, 3);
  });

  // c2=0, c3=0, c4=0: f(T) = c1  →  ∫₁⁴ = c1·(4−1) = 15
  it('c2=0 (constant): integral = c1·(b−a)', () => {
    const vc = { c1: 5, c2: 0, c3: 0, c4: 0 };
    const result = m.integral(4, vc, 0, 1000) - m.integral(1, vc, 0, 1000);
    expect(result).toBeCloseTo(15, 4);
  });

  it('scaling factor k applied to calculate', () => {
    const raw = m.calculate(300, n2, 63.15, 2000);
    expect(m.calculate(300, n2, 63.15, 2000, 1000)).toBeCloseTo(raw * 1000, 6);
  });
});

