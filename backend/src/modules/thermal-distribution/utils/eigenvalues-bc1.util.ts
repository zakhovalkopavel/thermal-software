/**
 * BC I eigenvalues — closed-form (no root-finding required).
 *
 * References:
 *   Plate:   Luikov, Ch. IV §3, p. 86, Eq. 4.3.14
 *   Cylinder: Luikov, Ch. IV §5, p. 122; McMahon expansion (AMS-55 §9.5.12)
 *   Sphere:  Luikov, Ch. IV §4, p. 107, Eq. 4.4.19
 */
import { besselJ0Roots } from '../../../common/utils/bessel.util';

/**
 * Eigenvalues μₙ = (2n−1)·π/2 for an infinite plate under BC I.
 * Luikov, Ch. IV §3, p. 86, Eq. 4.3.14.
 */
export function plateEigenvaluesBC1(N: number): number[] {
  const mu: number[] = [];
  for (let n = 1; n <= N; n++) mu.push((2 * n - 1) * Math.PI / 2);
  return mu;
}

/**
 * Eigenvalues μₙ (positive roots of J₀(μ) = 0) for an infinite cylinder under BC I.
 * Luikov, Ch. IV §5, p. 122; roots obtained via McMahon + Newton refinement.
 */
export function cylinderEigenvaluesBC1(N: number): number[] {
  return besselJ0Roots(N);
}

/**
 * Eigenvalues μₙ = n·π for a solid sphere under BC I.
 * Luikov, Ch. IV §4, p. 107, Eq. 4.4.19.
 */
export function sphereEigenvaluesBC1(N: number): number[] {
  const mu: number[] = [];
  for (let n = 1; n <= N; n++) mu.push(n * Math.PI);
  return mu;
}
