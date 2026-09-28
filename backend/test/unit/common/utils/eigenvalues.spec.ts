/**
 * Unit tests for eigenvalue solvers.
 *
 * Tests are separate from thermal-distribution integration tests per spec requirement.
 * Validates both BC I (closed-form) and BC III (Newton-Raphson) eigenvalue equations.
 *
 * Reference equations:
 *   Plate BC III:    μ·tan(μ) = Bi  (Luikov Ch. VI §3, p. 195)
 *   Cylinder BC III: μ·J₁(μ) − Bi·J₀(μ) = 0  (Luikov Ch. VI §6, p. 240)
 *   Sphere BC III:   tan(μ) = μ/(1−Bi)  (Luikov Ch. VI §5, p. 224)
 *   Hollow BC III:   Bessel-Neumann determinant = 0  (Luikov Ch. VI §7, p. 255)
 */

import { plateEigenvaluesBC1, cylinderEigenvaluesBC1, sphereEigenvaluesBC1 }
  from '../../../../src/modules/thermal-distribution/utils/eigenvalues-bc1.util';
import { plateEigenvaluesBC3, cylinderEigenvaluesBC3, sphereEigenvaluesBC3 }
  from '../../../../src/modules/thermal-distribution/utils/eigenvalues-bc3.util';
import { hollowCylinderEigenvaluesBC3 }
  from '../../../../src/modules/thermal-distribution/utils/eigenvalues-hollow-bc3.util';
import { besselJ0, besselJ1, besselY0, besselY1 }
  from '../../../../src/common/utils/bessel.util';
import { brentq } from '../../../../src/common/utils/root-finding.util';

// ─── BC I (closed-form) ───────────────────────────────────────────────────────

describe('plateEigenvaluesBC1', () => {
  it('μₙ = (2n−1)·π/2', () => {
    const mu = plateEigenvaluesBC1(5);
    expect(mu[0]).toBeCloseTo(Math.PI / 2, 12);
    expect(mu[1]).toBeCloseTo(3 * Math.PI / 2, 12);
    expect(mu[2]).toBeCloseTo(5 * Math.PI / 2, 12);
    expect(mu[4]).toBeCloseTo(9 * Math.PI / 2, 12);
  });

  it('returns N values', () => {
    expect(plateEigenvaluesBC1(20)).toHaveLength(20);
  });
});

describe('cylinderEigenvaluesBC1', () => {
  it('returns positive zeros of J₀ (first 5 match tabulated)', () => {
    const known = [2.40482556, 5.52007811, 8.65372791, 11.79153444, 14.93091771];
    const mu = cylinderEigenvaluesBC1(5);
    for (let i = 0; i < 5; i++) {
      expect(mu[i]).toBeCloseTo(known[i], 5);
    }
  });

  it('|J₀(μₙ)| < 1e-9 for all returned roots', () => {
    const mu = cylinderEigenvaluesBC1(15);
    for (const m of mu) {
      expect(Math.abs(besselJ0(m))).toBeLessThan(1e-9);
    }
  });
});

describe('sphereEigenvaluesBC1', () => {
  it('μₙ = n·π', () => {
    const mu = sphereEigenvaluesBC1(5);
    for (let n = 1; n <= 5; n++) {
      expect(mu[n - 1]).toBeCloseTo(n * Math.PI, 12);
    }
  });
});

// ─── BC III plate ─────────────────────────────────────────────────────────────

describe('plateEigenvaluesBC3', () => {
  const checkPlateEq = (mu: number, Bi: number) =>
    mu * Math.sin(mu) - Bi * Math.cos(mu); // f(μ) = 0 ↔ μ·tan(μ) = Bi

  it('roots satisfy μ·tan(μ) = Bi for Bi=1', () => {
    const mu = plateEigenvaluesBC3(1, 10);
    for (const m of mu) {
      expect(Math.abs(checkPlateEq(m, 1))).toBeLessThan(1e-10);
    }
  });

  it('roots satisfy μ·tan(μ) = Bi for Bi=10', () => {
    const mu = plateEigenvaluesBC3(10, 10);
    for (const m of mu) {
      expect(Math.abs(checkPlateEq(m, 10))).toBeLessThan(1e-10);
    }
  });

  it('roots are monotonically increasing', () => {
    const mu = plateEigenvaluesBC3(5, 20);
    for (let i = 1; i < mu.length; i++) {
      expect(mu[i]).toBeGreaterThan(mu[i - 1]);
    }
  });

  it('consecutive roots are ~π apart (one per branch)', () => {
    const mu = plateEigenvaluesBC3(2, 15);
    for (let i = 1; i < mu.length; i++) {
      const gap = mu[i] - mu[i - 1];
      expect(gap).toBeGreaterThan(2.5);
      expect(gap).toBeLessThan(Math.PI + 0.1);
    }
  });

  it('as Bi → 0, first root → 0 (adiabatic limit)', () => {
    const mu = plateEigenvaluesBC3(1e-10, 3);
    expect(mu[0]).toBeCloseTo(0, 4);
  });

  it('as Bi → ∞, roots → (2n−1)·π/2 (BC I limit)', () => {
    const mu = plateEigenvaluesBC3(1e6, 5);
    const bc1 = plateEigenvaluesBC1(5);
    for (let i = 0; i < 5; i++) {
      expect(mu[i]).toBeCloseTo(bc1[i], 3);
    }
  });
});

// ─── BC III cylinder ──────────────────────────────────────────────────────────

describe('cylinderEigenvaluesBC3', () => {
  const checkCylEq = (mu: number, Bi: number) =>
    mu * besselJ1(mu) - Bi * besselJ0(mu);

  it('roots satisfy μ·J₁(μ) − Bi·J₀(μ) = 0 for Bi=1', () => {
    const mu = cylinderEigenvaluesBC3(1, 10);
    for (const m of mu) {
      expect(Math.abs(checkCylEq(m, 1))).toBeLessThan(1e-10);
    }
  });

  it('roots satisfy characteristic equation for Bi=5', () => {
    const mu = cylinderEigenvaluesBC3(5, 10);
    for (const m of mu) {
      expect(Math.abs(checkCylEq(m, 5))).toBeLessThan(1e-10);
    }
  });

  it('roots are positive and monotonically increasing', () => {
    const mu = cylinderEigenvaluesBC3(2, 10);
    for (const m of mu) expect(m).toBeGreaterThan(0);
    for (let i = 1; i < mu.length; i++) expect(mu[i]).toBeGreaterThan(mu[i - 1]);
  });

  it('as Bi → ∞, roots → zeros of J₀ (BC I limit)', () => {
    const mu = cylinderEigenvaluesBC3(1e6, 5);
    const bc1 = cylinderEigenvaluesBC1(5);
    for (let i = 0; i < 5; i++) {
      expect(mu[i]).toBeCloseTo(bc1[i], 2);
    }
  });
});

// ─── BC III sphere ────────────────────────────────────────────────────────────

describe('sphereEigenvaluesBC3', () => {
  const checkSphereEq = (mu: number, Bi: number) =>
    mu * Math.cos(mu) - (1 - Bi) * Math.sin(mu); // tan(μ) = μ/(1−Bi)

  it('roots satisfy tan(μ) = μ/(1−Bi) for Bi=2', () => {
    const mu = sphereEigenvaluesBC3(2, 10);
    for (const m of mu) {
      expect(Math.abs(checkSphereEq(m, 2))).toBeLessThan(1e-10);
    }
  });

  it('roots satisfy characteristic equation for Bi=10', () => {
    const mu = sphereEigenvaluesBC3(10, 10);
    for (const m of mu) {
      expect(Math.abs(checkSphereEq(m, 10))).toBeLessThan(1e-10);
    }
  });

  it('as Bi → ∞, roots → n·π (BC I limit)', () => {
    const mu = sphereEigenvaluesBC3(1e6, 5);
    const bc1 = sphereEigenvaluesBC1(5);
    for (let i = 0; i < 5; i++) {
      expect(mu[i]).toBeCloseTo(bc1[i], 2);
    }
  });
});

// ─── BC III hollow cylinder ───────────────────────────────────────────────────

describe('hollowCylinderEigenvaluesBC3', () => {
  const R1 = 0.02, R2 = 0.05;
  const alpha = 500, lambda = 40;
  const H = alpha / lambda; // H1 = H2

  /** Hollow cylinder characteristic function value (must be ≈ 0 at roots). */
  function hollowF(p: number, r1 = R1, r2 = R2, H1 = H, H2 = H): number {
    const j0r1 = besselJ0(p * r1), j1r1 = besselJ1(p * r1);
    const j0r2 = besselJ0(p * r2), j1r2 = besselJ1(p * r2);
    const y0r1 = besselY0(p * r1), y1r1 = besselY1(p * r1);
    const y0r2 = besselY0(p * r2), y1r2 = besselY1(p * r2);
    const A = H1 * j0r1 + p * j1r1;
    const B = H2 * y0r2 - p * y1r2;
    const C = H2 * j0r2 - p * j1r2;
    const D = H1 * y0r1 + p * y1r1;
    return A * B - C * D;
  }

  /** F changes sign within ±1e-8 relative of p, i.e. p is a root of F. */
  function isRoot(p: number, H1 = H, H2 = H): boolean {
    const d = p * 1e-8;
    return hollowF(p - d, R1, R2, H1, H2) * hollowF(p + d, R1, R2, H1, H2) <= 0;
  }

  it('returns N roots', () => {
    expect(hollowCylinderEigenvaluesBC3(R1, R2, H, H, 5)).toHaveLength(5);
  });

  it('all roots are positive', () => {
    const ps = hollowCylinderEigenvaluesBC3(R1, R2, H, H, 5);
    for (const p of ps) expect(p).toBeGreaterThan(0);
  });

  it('roots satisfy the characteristic equation (F changes sign within ±1e-8·pₙ)', () => {
    const ps = hollowCylinderEigenvaluesBC3(R1, R2, H, H, 5);
    for (const p of ps) expect(isRoot(p)).toBe(true);
  });

  it('roots are monotonically increasing', () => {
    const ps = hollowCylinderEigenvaluesBC3(R1, R2, H, H, 8);
    for (let i = 1; i < ps.length; i++) {
      expect(ps[i]).toBeGreaterThan(ps[i - 1]);
    }
  });

  it('H1 ≠ H2: roots are positive, increasing and satisfy the characteristic equation', () => {
    const H1 = 2, H2 = 50;
    const ps = hollowCylinderEigenvaluesBC3(R1, R2, H1, H2, 6);
    expect(ps[0]).toBeGreaterThan(0);
    for (let i = 1; i < ps.length; i++) expect(ps[i]).toBeGreaterThan(ps[i - 1]);
    for (const p of ps) expect(isRoot(p, H1, H2)).toBe(true);
  });

  it('thin wall: roots → slab roots tan(pL) = p(H1+H2)/(p²−H1·H2)', () => {
    const r1 = 1, r2 = 1.01, L = r2 - r1;
    const H1 = 20, H2 = 80;
    const slab = (p: number) =>
      (p * p - H1 * H2) * Math.sin(p * L) - p * (H1 + H2) * Math.cos(p * L);

    const slabRoots: number[] = [];
    const step = Math.PI / L / 400;
    for (let p = step; slabRoots.length < 3; p += step) {
      if (slab(p - step) * slab(p) < 0) slabRoots.push(brentq(slab, p - step, p, 1e-12).root);
    }

    const ps = hollowCylinderEigenvaluesBC3(r1, r2, H1, H2, 3);
    for (let i = 0; i < 3; i++) {
      expect(Math.abs(ps[i] - slabRoots[i]) / slabRoots[i]).toBeLessThan(0.01);
    }
  });
});
