import { GAUSS_LEGENDRE_TABLES } from './gauss-legendre-tables.constants';
import { GaussNodeCount } from './gauss-node-count.type';

/**
 * Approximate ∫ₐᵇ f(x) dx using N-point Gauss–Legendre quadrature.
 * Supported N values: 8, 16, 20, 32, 64.
 *
 *   ∫ₐᵇ f(x) dx  =  (b−a)/2 · Σᵢ wᵢ · f( (b+a)/2 + (b−a)/2 · xᵢ )
 *
 * @param f  Integrand
 * @param a  Lower bound
 * @param b  Upper bound
 * @param N  Number of quadrature nodes (default: 32)
 */
export function gaussLegendre(
  f: (x: number) => number,
  a: number,
  b: number,
  N: GaussNodeCount = 32,
): number {
  const { nodes, weights } = GAUSS_LEGENDRE_TABLES[N];
  const mid  = (a + b) / 2;
  const half = (b - a) / 2;
  let sum = 0;
  for (let i = 0; i < nodes.length; i++) {
    sum += weights[i] * f(mid + half * nodes[i]);
  }
  return half * sum;
}
