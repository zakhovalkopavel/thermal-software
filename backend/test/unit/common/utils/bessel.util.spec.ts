/**
 * Unit tests for common/utils/bessel.util.ts
 *
 * Validates that the stdlib wrappers return correct values and that
 * besselJ0Roots finds accurate roots.
 *
 * Reference values from:
 *   Abramowitz & Stegun — Handbook of Mathematical Functions (AMS-55), 1964.
 *   NIST DLMF — https://dlmf.nist.gov/10.21
 */

import {
  besselJ0,
  besselJ1,
  besselY0,
  besselY1,
  besselJ0Roots,
} from '../../../../src/common/utils/bessel.util';

// ─── J₀ ──────────────────────────────────────────────────────────────────────

describe('besselJ0', () => {
  it('J₀(0) = 1', () => {
    expect(besselJ0(0)).toBeCloseTo(1.0, 12);
  });

  it('J₀(1) ≈ 0.7651976866 (AMS-55 Table 9.1)', () => {
    expect(besselJ0(1)).toBeCloseTo(0.7651976866, 8);
  });

  it('J₀(2) ≈ 0.2238907791', () => {
    expect(besselJ0(2)).toBeCloseTo(0.2238907791, 8);
  });

  it('J₀(5) ≈ −0.1775967713', () => {
    expect(besselJ0(5)).toBeCloseTo(-0.1775967713, 8);
  });

  it('J₀(10) ≈ −0.2459357645', () => {
    expect(besselJ0(10)).toBeCloseTo(-0.2459357645, 8);
  });

  it('J₀ is even: J₀(−x) = J₀(x)', () => {
    for (const x of [1, 2.5, 7]) {
      expect(besselJ0(-x)).toBeCloseTo(besselJ0(x), 14);
    }
  });
});

// ─── J₁ ──────────────────────────────────────────────────────────────────────

describe('besselJ1', () => {
  it('J₁(0) = 0', () => {
    expect(besselJ1(0)).toBeCloseTo(0.0, 12);
  });

  it('J₁(1) ≈ 0.4400505857 (AMS-55 Table 9.1)', () => {
    expect(besselJ1(1)).toBeCloseTo(0.4400505857, 8);
  });

  it('J₁(2) ≈ 0.5767248078', () => {
    expect(besselJ1(2)).toBeCloseTo(0.5767248078, 8);
  });

  it('J₁(5) ≈ −0.3275791376', () => {
    expect(besselJ1(5)).toBeCloseTo(-0.3275791376, 8);
  });

  it('J₁ is odd: J₁(−x) = −J₁(x)', () => {
    for (const x of [1, 3, 8]) {
      expect(besselJ1(-x)).toBeCloseTo(-besselJ1(x), 14);
    }
  });
});

// ─── Y₀ ──────────────────────────────────────────────────────────────────────

describe('besselY0', () => {
  it('throws for x ≤ 0', () => {
    expect(() => besselY0(0)).toThrow(RangeError);
    expect(() => besselY0(-1)).toThrow(RangeError);
  });

  it('Y₀(1) ≈ 0.0882569642 (AMS-55 Table 9.1)', () => {
    expect(besselY0(1)).toBeCloseTo(0.0882569642, 8);
  });

  it('Y₀(2) ≈ 0.5103756726 (stdlib 0.4.x)', () => {
    expect(besselY0(2)).toBeCloseTo(0.5103756726, 8);
  });

  it('Y₀(5) ≈ −0.3085176252', () => {
    expect(besselY0(5)).toBeCloseTo(-0.3085176252, 8);
  });

  it('Y₀(10) ≈ 0.0556711673', () => {
    expect(besselY0(10)).toBeCloseTo(0.0556711673, 8);
  });
});

// ─── Y₁ ──────────────────────────────────────────────────────────────────────

describe('besselY1', () => {
  it('throws for x ≤ 0', () => {
    expect(() => besselY1(0)).toThrow(RangeError);
    expect(() => besselY1(-1)).toThrow(RangeError);
  });

  it('Y₁(1) ≈ −0.7812128213 (AMS-55 Table 9.1)', () => {
    expect(besselY1(1)).toBeCloseTo(-0.7812128213, 8);
  });

  it('Y₁(2) ≈ −0.1070324315 — actually ≈ 0.1070324315?', () => {
    // AMS-55 Table 9.1: Y₁(2) ≈ −0.1070324315
    expect(besselY1(2)).toBeCloseTo(-0.1070324315, 8);
  });

  it('Y₁(5) ≈ 0.1478631433', () => {
    expect(besselY1(5)).toBeCloseTo(0.1478631433, 8);
  });
});

// ─── besselJ0Roots ────────────────────────────────────────────────────────────

describe('besselJ0Roots', () => {
  // First five positive zeros of J₀ (DLMF 10.21.19 / AMS-55 Table 9.5)
  const KNOWN_ROOTS = [2.40482556, 5.52007811, 8.65372791, 11.79153444, 14.93091771];

  it('returns N roots', () => {
    expect(besselJ0Roots(10)).toHaveLength(10);
  });

  it('first root ≈ 2.40482556', () => {
    expect(besselJ0Roots(1)[0]).toBeCloseTo(KNOWN_ROOTS[0], 6);
  });

  it('first 5 roots match tabulated values to 6 decimal places', () => {
    const roots = besselJ0Roots(5);
    for (let i = 0; i < 5; i++) {
      expect(roots[i]).toBeCloseTo(KNOWN_ROOTS[i], 6);
    }
  });

  it('roots are actual zeros: |J₀(μₙ)| < 1e-10', () => {
    const roots = besselJ0Roots(10);
    for (const mu of roots) {
      expect(Math.abs(besselJ0(mu))).toBeLessThan(1e-10);
    }
  });

  it('roots are monotonically increasing', () => {
    const roots = besselJ0Roots(15);
    for (let i = 1; i < roots.length; i++) {
      expect(roots[i]).toBeGreaterThan(roots[i - 1]);
    }
  });

  it('consecutive roots are ~π apart for large n', () => {
    const roots = besselJ0Roots(20);
    for (let i = 10; i < 19; i++) {
      expect(roots[i + 1] - roots[i]).toBeCloseTo(Math.PI, 2);
    }
  });
});
