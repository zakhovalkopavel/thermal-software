/**
 * Composite Simpson's rule.
 *
 *   ∫ₐᵇ f(x) dx ≈ h/3 · [f(a) + 4·Σf(x_odd) + 2·Σf(x_even) + f(b)],  h = (b − a)/n
 *
 * References:
 *   Abramowitz, M.; Stegun, I.A. — Handbook of Mathematical Functions, NBS AMS-55, 1964, §25.4.6.
 */

/**
 * Integrate f on [a, b] with the composite Simpson rule.
 *
 * @param f  Integrand
 * @param a  Lower bound
 * @param b  Upper bound
 * @param n  Number of subintervals (default 128); an odd n is raised to the next even value
 */
export function simpson(
  f: (x: number) => number,
  a: number,
  b: number,
  n = 128,
): number {
  const m = n % 2 === 0 ? n : n + 1;
  const h = (b - a) / m;
  let s = f(a) + f(b);
  for (let i = 1; i < m; i++) s += (i % 2 === 0 ? 2 : 4) * f(a + i * h);
  return (h / 3) * s;
}
