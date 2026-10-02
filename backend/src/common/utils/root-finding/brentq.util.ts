import { Root1dResult } from './root-1d-result.interface';

/**
 * Find a root of f in [a, b] using Brent's method.
 * Equivalent to: scipy.optimize.brentq(f, a, b, xtol=tol)
 *
 * Requirements: f(a) and f(b) must have opposite signs.
 *
 * @param f   Scalar function
 * @param a   Left bracket
 * @param b   Right bracket
 * @param tol Absolute tolerance (default 1e-10)
 */
export function brentq(
  f: (x: number) => number,
  a: number,
  b: number,
  tol = 1e-10,
): Root1dResult {
  const { zero } = require('brent-zero-generator') as {
    zero: (f: (x: number) => number, a: number, b: number, macheps: number, t: number) => number;
  };
  // Library stops when |m| ≤ 2·macheps·|b| + t; the macheps term keeps every step ≥ 1 ulp.
  const root = zero(f, a, b, Number.EPSILON, tol / 2);
  return { root };
}
