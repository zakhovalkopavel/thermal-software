import { MinimizeResult } from './minimize-result.interface';

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
