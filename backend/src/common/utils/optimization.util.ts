/**
 * Scalar and multi-variable minimisation utilities.
 *
 * Thin, typed wrappers around verified npm packages.
 * All methods mirror their SciPy equivalents by name and semantics.
 *
 * Package loading notes (CommonJS project):
 *   fmin — "type":"module" but build is UMD; loaded via Function wrapper.
 *
 * SciPy mapping:
 *   brent           → scipy.optimize.brent
 *   nelderMead      → scipy.optimize.minimize(method='Nelder-Mead')
 *   conjugateGradient → scipy.optimize.minimize(method='CG')
 */

import * as fs from 'fs';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MinimizeResult {
  /** Solution vector */
  x: number[];
  /** Objective value at solution */
  fx: number;
}

// ─── fmin UMD loader (singleton) ─────────────────────────────────────────────
// fmin@0.0.4 ships "type":"module" in package.json but the actual build/fmin.js
// is a UMD bundle. Dynamic import() fails because Node treats it as ESM.
// Solution: load the UMD source text and execute it via Function() which bypasses
// the module-type check while fully initialising the CJS exports object.

interface FminExports {
  nelderMead(
    f: (x: number[]) => number,
    x0: number[],
    params?: { maxIterations?: number; tolerance?: number },
  ): { x: number[]; fx: number };

  conjugateGradient(
    f: (x: number[], grad: number[]) => number,
    x0: number[],
    params?: { maxIterations?: number },
  ): { x: number[]; fx: number };
}

let _fmin: FminExports | null = null;

function getFmin(): FminExports {
  if (_fmin) return _fmin;
  const fminPath = require.resolve('fmin/build/fmin.js');
  const src = fs.readFileSync(fminPath, 'utf8');
  const mod = { exports: {} as FminExports };
  // eslint-disable-next-line no-new-func
  new Function('module', 'exports', 'require', src)(mod, mod.exports, require);
  _fmin = mod.exports;
  return _fmin;
}

// ─── Implementation ───────────────────────────────────────────────────────────

/**
 * Minimise a scalar function of one variable on [a, b] using golden-section search.
 * Equivalent to: scipy.optimize.brent(f, brack=(a, b))
 *
 * Pure implementation — no external package needed for a simple 1-D bracketed minimum.
 *
 * @param f   Scalar function
 * @param a   Left bracket
 * @param b   Right bracket
 * @param tol Absolute tolerance (default 1e-8)
 */
export function brent(
  f: (x: number) => number,
  a: number,
  b: number,
  tol = 1e-8,
): MinimizeResult {
  const phi = (Math.sqrt(5) - 1) / 2; // 0.6180…
  let lo = a, hi = b;
  let x1 = hi - phi * (hi - lo);
  let x2 = lo + phi * (hi - lo);
  let f1 = f(x1), f2 = f(x2);
  let iters = 0;
  while (Math.abs(hi - lo) > tol && iters++ < 200) {
    if (f1 < f2) { hi = x2; x2 = x1; f2 = f1; x1 = hi - phi * (hi - lo); f1 = f(x1); }
    else         { lo = x1; x1 = x2; f1 = f2; x2 = lo + phi * (hi - lo); f2 = f(x2); }
  }
  const xMin = (lo + hi) / 2;
  return { x: [xMin], fx: f(xMin) };
}

/**
 * Minimise a scalar function of N variables using the Nelder-Mead simplex algorithm.
 * Equivalent to: scipy.optimize.minimize(f, x0, method='Nelder-Mead')
 *
 * No gradient required. Robust for non-smooth functions.
 *
 * @param f    Objective function f(x) → scalar
 * @param x0   Initial guess vector
 * @param opts { maxIterations?, tolerance? }
 */
export function nelderMead(
  f: (x: number[]) => number,
  x0: number[],
  opts: { maxIterations?: number; tolerance?: number } = {},
): MinimizeResult {
  const result = getFmin().nelderMead(f, x0.slice(), opts);
  return { x: result.x, fx: result.fx };
}

/**
 * Minimise a scalar function of N variables using the Polak-Ribière
 * conjugate-gradient method with Wolfe line search.
 * Equivalent to: scipy.optimize.minimize(f, x0, method='CG')
 *
 * Requires the gradient. Faster than Nelder-Mead when gradient is available.
 *
 * @param f    Function returning scalar AND writing gradient into the second argument:
 *             f(x: number[], grad: number[]): number
 *             The function must mutate grad in-place and return the scalar value.
 * @param x0   Initial guess vector
 * @param opts { maxIterations? }
 */
export function conjugateGradient(
  f: (x: number[], grad: number[]) => number,
  x0: number[],
  opts: { maxIterations?: number } = {},
): MinimizeResult {
  const result = getFmin().conjugateGradient(f, x0.slice(), opts);
  return { x: result.x, fx: result.fx };
}
