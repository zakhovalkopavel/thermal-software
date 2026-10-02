import { getFmin } from './get-fmin.util';
import { MinimizeResult } from './minimize-result.interface';

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
