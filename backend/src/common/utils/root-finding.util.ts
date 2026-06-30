/**
 * 1-D root-finding utilities.
 *
 * Thin, typed wrappers around verified npm packages.
 * All methods mirror their SciPy equivalents by name and semantics.
 *
 * SciPy mapping:
 *   brentq   → scipy.optimize.brentq
 *   newton   → scipy.optimize.newton (polish step only)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Root1dResult {
  root: number;
  /** Iterations used */
  iterations?: number;
}

// ─── Implementation ───────────────────────────────────────────────────────────

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
    zero: (f: (x: number) => number, a: number, b: number, tol: number) => number;
  };
  const root = zero(f, a, b, tol);
  return { root };
}

/**
 * Refine a root estimate using Newton-Raphson iterations.
 * Use after brentq to tighten |f(root)| to near machine precision.
 * Equivalent to a few steps of scipy.optimize.newton(f, x0, fprime=df)
 *
 * @param f    Function whose root is sought
 * @param df   Derivative of f
 * @param x0   Initial estimate (e.g. from brentq)
 * @param tol  Stop when |f(x)| < tol (default 1e-14)
 */
export function newtonPolish(
  f: (x: number) => number,
  df: (x: number) => number,
  x0: number,
  tol = 1e-14,
): number {
  let x = x0;
  for (let i = 0; i < 10; i++) {
    const fx = f(x);
    if (Math.abs(fx) < tol) break;
    const dfx = df(x);
    if (Math.abs(dfx) < 1e-30) break;
    x -= fx / dfx;
  }
  return x;
}
