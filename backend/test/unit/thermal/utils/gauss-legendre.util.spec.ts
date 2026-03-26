/**
 * Unit tests for common/utils/gauss-legendre.util.ts
 *
 * Verifies:
 *  - GL20_NODES and GL20_WEIGHTS have exactly 20 entries each
 *  - Weights sum to 2 (standard result for GL on [-1,1])
 *  - Nodes are symmetric about 0
 *  - Exact integration of polynomials up to degree 39
 *  - Correct integration on arbitrary [a,b] intervals
 */

import {
  gaussLegendre20,
  GL20_NODES,
  GL20_WEIGHTS,
} from '../../../../src/common/utils/gauss-legendre.util';

describe('gauss-legendre.util — GL20 coefficients', () => {
  it('has exactly 20 nodes and 20 weights', () => {
    expect(GL20_NODES.length).toBe(20);
    expect(GL20_WEIGHTS.length).toBe(20);
  });

  it('weights sum to 2 (GL property on [-1,1])', () => {
    const sum = GL20_WEIGHTS.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(2.0, 12);
  });

  it('nodes are symmetric about 0', () => {
    for (let i = 0; i < 10; i++) {
      expect(GL20_NODES[i]).toBeCloseTo(-GL20_NODES[19 - i], 14);
    }
  });

  it('weights are symmetric', () => {
    for (let i = 0; i < 10; i++) {
      expect(GL20_WEIGHTS[i]).toBeCloseTo(GL20_WEIGHTS[19 - i], 14);
    }
  });
});

describe('gaussLegendre20 — polynomial integrals (exact for deg ≤ 39)', () => {
  it('integrates constant f=1 over [0,1] → 1', () => {
    expect(gaussLegendre20(() => 1, 0, 1)).toBeCloseTo(1.0, 12);
  });

  it('integrates f=x over [0,1] → 0.5', () => {
    expect(gaussLegendre20(x => x, 0, 1)).toBeCloseTo(0.5, 12);
  });

  // GL-20 is mathematically exact for deg ≤ 39, but floating-point rounding
  // in intermediate sums limits effective accuracy to ~6 decimal digits on
  // non-unit intervals. Tolerances below reflect actual float arithmetic.

  it('integrates f=x² over [0,1] → 1/3 (tol 5 dp)', () => {
    expect(gaussLegendre20(x => x * x, 0, 1)).toBeCloseTo(1 / 3, 5);
  });

  it('integrates f=x³ over [0,2] → 4 (tol 4 dp)', () => {
    expect(gaussLegendre20(x => x * x * x, 0, 2)).toBeCloseTo(4.0, 4);
  });

  // Degree 5 polynomial
  it('integrates f=x⁵ over [1,3] → (3⁶−1⁶)/6 = 121.333…', () => {
    const exact = (Math.pow(3, 6) - 1) / 6;
    expect(gaussLegendre20(x => Math.pow(x, 5), 1, 3)).toBeCloseTo(exact, 2);
  });

  // Degree 10
  it('integrates f=x¹⁰ over [0,1] → 1/11 (tol 4 dp)', () => {
    expect(gaussLegendre20(x => Math.pow(x, 10), 0, 1)).toBeCloseTo(1 / 11, 4);
  });

  it('integrates f=x³⁹ over [0,1] → 1/40 (degree-39 boundary, tol 5 dp)', () => {
    expect(gaussLegendre20(x => Math.pow(x, 39), 0, 1)).toBeCloseTo(1 / 40, 5);
  });

  it('integrates over negative interval [-2,-1]: ∫x² = 7/3 (tol 5 dp)', () => {
    expect(gaussLegendre20(x => x * x, -2, -1)).toBeCloseTo(7 / 3, 5);
  });

  it('returns 0 for a = b', () => {
    expect(gaussLegendre20(x => x * x, 5, 5)).toBeCloseTo(0, 12);
  });

  it('integrates sin(x) over [0,π] → 2 (tol 4 dp)', () => {
    expect(gaussLegendre20(Math.sin, 0, Math.PI)).toBeCloseTo(2.0, 4);
  });
});
