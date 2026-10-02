import { gaussLegendre } from './gauss-legendre.util';

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
