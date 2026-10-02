import { newtonPolish } from '../root-finding';
import { besselJ0 } from './bessel-j0.util';
import { besselJ1 } from './bessel-j1.util';

/**
 * Compute the first N positive roots of J₀(μ) = 0.
 *
 * Uses McMahon's asymptotic expansion (AMS-55 §9.5.12) for the initial guess,
 * then refines each root with Newton's method (newtonPolish, J₀'(μ) = −J₁(μ)).
 *
 * Used by eigenvalues-bc1.util (cylinder BC I eigenvalues) and
 * eigenvalues-bc3.util (brackets for the cylinder BC III roots).
 */
export function besselJ0Roots(N: number): number[] {
  const roots: number[] = [];
  for (let n = 1; n <= N; n++) {
    const b = Math.PI * (n - 0.25);
    const guess = b + 1 / (8 * b) - 31 / (384 * b ** 3) + 3779 / (15360 * b ** 5);
    roots.push(newtonPolish(besselJ0, (x) => -besselJ1(x), guess));
  }
  return roots;
}
