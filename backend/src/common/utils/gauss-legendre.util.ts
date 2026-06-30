/**
 * Gauss–Legendre quadrature functions.
 *
 * Implements the standard change-of-variables rule for [a, b]:
 *
 *   ∫ₐᵇ f(x) dx  =  (b−a)/2 · Σᵢ wᵢ · f( (b+a)/2 + (b−a)/2 · xᵢ )
 *
 * Node/weight tables live in gauss-legendre.constants.ts (SRP).
 *
 * References:
 *   Abramowitz, M.; Stegun, I.A. — Handbook of Mathematical Functions, NBS AMS-55, 1964.
 *   Table 25.4 (pp. 916–919).
 */

import { GL_TABLES, GL20, type GaussNodeCount } from './gauss-legendre.constants';

export type { GaussNodeCount } from './gauss-legendre.constants';

/** Gauss–Legendre 20-point nodes on (−1, 1). Source: Abramowitz & Stegun, Table 25.4. */
export const GL20_NODES: readonly number[] = GL20.nodes;
/** Gauss–Legendre 20-point weights. Source: Abramowitz & Stegun, Table 25.4. */
export const GL20_WEIGHTS: readonly number[] = GL20.weights;

/**
 * Approximate ∫ₐᵇ f(x) dx using N-point Gauss–Legendre quadrature.
 * Supported N values: 8, 16, 20, 32, 64.
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
  const { nodes, weights } = GL_TABLES[N];
  const mid  = (a + b) / 2;
  const half = (b - a) / 2;
  let sum = 0;
  for (let i = 0; i < nodes.length; i++) {
    sum += weights[i] * f(mid + half * nodes[i]);
  }
  return half * sum;
}

/**
 * Approximate ∫ₐᵇ f(x) dx using the 20-point Gauss–Legendre rule.
 *
 * Exact for polynomials of degree ≤ 39. Use when no closed-form antiderivative
 * exists (e.g. DIPPR-102 with non-integer exponent c2).
 *
 * @param f  Integrand f(x)
 * @param a  Lower bound
 * @param b  Upper bound
 */
export function gaussLegendre20(f: (x: number) => number, a: number, b: number): number {
  return gaussLegendre(f, a, b, 20);
}

