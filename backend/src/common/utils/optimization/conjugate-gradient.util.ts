import { getFmin } from './get-fmin.util';
import { MinimizeResult } from './minimize-result.interface';

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
