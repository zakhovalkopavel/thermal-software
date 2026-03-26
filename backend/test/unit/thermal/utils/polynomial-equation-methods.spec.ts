/**
 * Unit tests for all simple polynomial equation methods.
 *
 * Covers: LinearEquationMethod, QuadraticEquationMethod,
 *         CubicEquationMethod, QuarticEquationMethod
 *
 * For each method verifies:
 *   - calculate() at a point inside range
 *   - integral() antiderivative value
 *   - calculateAverage() = (integral(x2) - integral(x1)) / (x2 - x1)
 *   - clamping at range boundaries (min/max enforcement)
 *   - scaling factor k
 */

import { LinearEquationMethod }   from '../../../../src/common/thermal/utils/linear-equation-method';
import { QuadraticEquationMethod } from '../../../../src/common/thermal/utils/quadratic-equation-method';
import { CubicEquationMethod }     from '../../../../src/common/thermal/utils/cubic-equation-method';
import { QuarticEquationMethod }   from '../../../../src/common/thermal/utils/quartic-equation-method';

// ─── LinearEquationMethod  f(T) = a + b·T ────────────────────────────────────

describe('LinearEquationMethod', () => {
  const m = new LinearEquationMethod();
  // f(T) = 10 + 2·T  →  f(300) = 610
  const v = { a: 10, b: 2 };

  it('calculate at 300 K', () => {
    expect(m.calculate(300, v, 200, 1000)).toBeCloseTo(610, 10);
  });

  it('integral: I(300) = 10·300 + 2·300²/2 = 93000', () => {
    expect(m.integral(300, v, 200, 1000)).toBeCloseTo(93000, 6);
  });

  it('calculateAverage over [200,400] = f(300) = 610 (linear midpoint rule)', () => {
    expect(m.calculateAverage(200, 400, v, 200, 1000)).toBeCloseTo(610, 8);
  });

  it('clamps T below min to min', () => {
    expect(m.calculate(100, v, 200, 1000)).toBeCloseTo(m.calculate(200, v, 200, 1000), 10);
  });

  it('clamps T above max to max', () => {
    expect(m.calculate(2000, v, 200, 1000)).toBeCloseTo(m.calculate(1000, v, 200, 1000), 10);
  });

  it('scaling factor k=0.001', () => {
    expect(m.calculate(300, v, 200, 1000, 0.001)).toBeCloseTo(0.610, 10);
  });

  it('integral derivative equals calculate (finite difference)', () => {
    const h = 1e-5;
    const T = 300;
    const dI = (m.integral(T + h, v, 200, 1000) - m.integral(T - h, v, 200, 1000)) / (2 * h);
    expect(dI).toBeCloseTo(m.calculate(T, v, 200, 1000), 5);
  });
});

// ─── QuadraticEquationMethod  f(T) = a + b·T + c·T² ─────────────────────────

describe('QuadraticEquationMethod', () => {
  const m = new QuadraticEquationMethod();
  // N2 thermal conductivity from Incropera p.839
  const v = { a: 0.00309, b: 7.593e-5, c: -1.1014e-8 };

  it('calculate at 300 K matches formula', () => {
    const T = 300;
    expect(m.calculate(T, v, 78, 1500)).toBeCloseTo(
      v.a + v.b * T + v.c * T * T, 8,
    );
  });

  it('integral derivative equals calculate (FD at 500 K)', () => {
    const h = 1e-5;
    const T = 500;
    const dI = (m.integral(T + h, v, 78, 1500) - m.integral(T - h, v, 78, 1500)) / (2 * h);
    expect(dI).toBeCloseTo(m.calculate(T, v, 78, 1500), 5);
  });

  it('calculateAverage matches (I(T2)−I(T1))/(T2−T1)', () => {
    const avg    = m.calculateAverage(300, 600, v, 78, 1500);
    const manual = (m.integral(600, v, 78, 1500) - m.integral(300, v, 78, 1500)) / 300;
    expect(avg).toBeCloseTo(manual, 10);
  });

  it('scaling factor k=3 applied', () => {
    expect(m.calculate(300, { a: 1, b: 0, c: 0 }, 0, 1000, 3)).toBeCloseTo(3, 10);
  });

  it('exact integral of c·T²: ∫₀¹ x² dx = 1/3', () => {
    const vc = { a: 0, b: 0, c: 1 };
    const val = m.integral(1, vc, 0, 10) - m.integral(0, vc, 0, 10);
    expect(val).toBeCloseTo(1 / 3, 12);
  });
});

// ─── CubicEquationMethod  f(T) = a + b·T + c·T² + d·T³ ──────────────────────

describe('CubicEquationMethod', () => {
  const m = new CubicEquationMethod();
  // CO2 Cp from Borgnakke p.911
  const v = { a: 22.26, b: 5.981e-2, c: -3.501e-5, d: 7.469e-9 };

  it('calculate at 500 K matches formula', () => {
    const T = 500;
    expect(m.calculate(T, v, 273, 1800)).toBeCloseTo(
      v.a + v.b * T + v.c * T * T + v.d * T * T * T, 8,
    );
  });

  it('integral derivative equals calculate (FD at 800 K)', () => {
    const h = 1e-5;
    const T = 800;
    const dI = (m.integral(T + h, v, 273, 1800) - m.integral(T - h, v, 273, 1800)) / (2 * h);
    expect(dI).toBeCloseTo(m.calculate(T, v, 273, 1800), 4);
  });

  it('calculateAverage of pure cubic d·T³ over [1,3] = 10', () => {
    // ∫₁³ T³ dT / 2 = [(3⁴−1⁴)/4] / 2 = 80/4/2 = 10
    const vc = { a: 0, b: 0, c: 0, d: 1 };
    expect(m.calculateAverage(1, 3, vc, 0, 1000)).toBeCloseTo(10, 8);
  });

  it('clamps below min', () => {
    expect(m.calculate(100, v, 273, 1800)).toBeCloseTo(m.calculate(273, v, 273, 1800), 10);
  });
});

// ─── QuarticEquationMethod  f(T) = a + b·T + c·T² + d·T³ + e·T⁴ ─────────────

describe('QuarticEquationMethod', () => {
  const m = new QuarticEquationMethod();
  // N2 Cp from Yaws1999 p.53
  const v = { a: 29.342, b: -3.5395e-3, c: 1.0076e-5, d: -4.3116e-9, e: 2.5935e-13 };

  it('calculate at 300 K — near 29.1 J/(mol·K)', () => {
    const result = m.calculate(300, v, 50, 1500);
    expect(result).toBeGreaterThan(28);
    expect(result).toBeLessThan(30.5);
  });

  it('calculate at 1000 K — near 32.7 J/(mol·K)', () => {
    const result = m.calculate(1000, v, 50, 1500);
    expect(result).toBeGreaterThan(31);
    expect(result).toBeLessThan(34);
  });

  it('integral derivative equals calculate (FD at 600 K)', () => {
    const h = 1e-5;
    const T = 600;
    const dI = (m.integral(T + h, v, 50, 1500) - m.integral(T - h, v, 50, 1500)) / (2 * h);
    expect(dI).toBeCloseTo(m.calculate(T, v, 50, 1500), 4);
  });

  it('calculateAverage over [300,600] is 28–32 J/(mol·K)', () => {
    const avg = m.calculateAverage(300, 600, v, 50, 1500);
    expect(avg).toBeGreaterThan(28);
    expect(avg).toBeLessThan(32);
  });

  it('exact integral of e·T⁴: ∫₀¹ x⁴ dx = 1/5', () => {
    const ve = { a: 0, b: 0, c: 0, d: 0, e: 1 };
    const val = m.integral(1, ve, 0, 10) - m.integral(0, ve, 0, 10);
    expect(val).toBeCloseTo(0.2, 12);
  });
});

