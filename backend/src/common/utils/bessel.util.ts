/**
 * Bessel functions of the first and second kind (J₀, J₁, Y₀, Y₁).
 *
 * Thin wrappers around @stdlib/math/base/special — machine-precision implementations.
 *
 * References:
 *   @stdlib/math — https://github.com/stdlib-js/stdlib
 *   Olver, F.W.J. et al. (eds.) — NIST Digital Library of Mathematical Functions, 2010.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const _j0: (x: number) => number = require('@stdlib/math/base/special/besselj0');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const _j1: (x: number) => number = require('@stdlib/math/base/special/besselj1');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const _y0: (x: number) => number = require('@stdlib/math/base/special/bessely0');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const _y1: (x: number) => number = require('@stdlib/math/base/special/bessely1');

// ─── J₀ ──────────────────────────────────────────────────────────────────────

/** Bessel function of the first kind, order 0: J₀(x). */
export function besselJ0(x: number): number {
  return _j0(x);
}

// ─── J₁ ──────────────────────────────────────────────────────────────────────

/** Bessel function of the first kind, order 1: J₁(x). Odd: J₁(−x) = −J₁(x). */
export function besselJ1(x: number): number {
  return _j1(x);
}

// ─── Y₀ ──────────────────────────────────────────────────────────────────────

/**
 * Bessel function of the second kind (Neumann function), order 0: Y₀(x).
 * Valid for x > 0.
 */
export function besselY0(x: number): number {
  if (x <= 0) throw new RangeError('besselY0: x must be > 0');
  return _y0(x);
}

// ─── Y₁ ──────────────────────────────────────────────────────────────────────

/**
 * Bessel function of the second kind (Neumann function), order 1: Y₁(x).
 * Valid for x > 0.
 */
export function besselY1(x: number): number {
  if (x <= 0) throw new RangeError('besselY1: x must be > 0');
  return _y1(x);
}

// ─── Roots of J₀ ─────────────────────────────────────────────────────────────

/**
 * Compute the first N positive roots of J₀(μ) = 0.
 *
 * Uses McMahon's asymptotic expansion (AMS-55 §9.5.12) for the initial guess,
 * then refines each root with Newton's method (J₀'(μ) = −J₁(μ)).
 *
 * Called by numeric.util.brentq via eigenvalues-bc1.util for the cylinder BC I case.
 */
export function besselJ0Roots(N: number): number[] {
  const roots: number[] = [];
  for (let n = 1; n <= N; n++) {
    const b = Math.PI * (n - 0.25);
    let mu = b + 1 / (8 * b) - 31 / (384 * b ** 3) + 3779 / (15360 * b ** 5);
    for (let iter = 0; iter < 10; iter++) {
      const j0 = besselJ0(mu);
      const j1 = besselJ1(mu);
      if (Math.abs(j1) < 1e-30) break;
      mu += j0 / j1; // Newton step: μ ← μ − J₀/J₀' = μ + J₀/J₁
      if (Math.abs(j0) < 1e-14) break;
    }
    roots.push(mu);
  }
  return roots;
}
