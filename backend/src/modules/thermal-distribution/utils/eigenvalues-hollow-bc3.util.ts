/**
 * Eigenvalues for BC III hollow cylinder (coupled Bessel-Neumann equation).
 *
 * The positive roots pₙ of the transcendental equation (Luikov Ch. VI §7 p.255, Eq. 6):
 *
 *   [α₁/λ · J₀(p·R₁) + p·J₁(p·R₁)] · [α₂/λ · Y₀(p·R₂) − p·Y₁(p·R₂)]
 *   − [α₂/λ · J₀(p·R₂) − p·J₁(p·R₂)] · [α₁/λ · Y₀(p·R₁) + p·Y₁(p·R₁)] = 0
 */
import { besselJ0, besselJ1, besselY0, besselY1 } from '../../../common/utils/bessel.util';

const DEFAULT_TOL      = 1e-10;
const DEFAULT_MAX_ITER = 50;

/** Evaluate the hollow-cylinder characteristic function F(p). */
function hollowCylF(
  p: number,
  R1: number,
  R2: number,
  H1: number, // α₁/λ
  H2: number, // α₂/λ
): number {
  const j0r1 = besselJ0(p * R1), j1r1 = besselJ1(p * R1);
  const y0r1 = besselY0(p * R1), y1r1 = besselY1(p * R1);
  const j0r2 = besselJ0(p * R2), j1r2 = besselJ1(p * R2);
  const y0r2 = besselY0(p * R2), y1r2 = besselY1(p * R2);

  const A = H1 * j0r1 + p * j1r1;
  const B = H2 * y0r2 - p * y1r2;
  const C = H2 * j0r2 - p * j1r2;
  const D = H1 * y0r1 + p * y1r1;
  return A * B - C * D;
}

/**
 * Find N positive roots of the hollow cylinder BC III eigenvalue equation.
 *
 * Roots are sought in the interval (0, maxP] using sign-change bracketing
 * on a fine mesh, then refined by bisection + one Newton step.
 *
 * @param R1   Inner radius (m)
 * @param R2   Outer radius (m)
 * @param H1   α₁/λ (inner surface)
 * @param H2   α₂/λ (outer surface)
 * @param N    Number of roots required
 */
export function hollowCylinderEigenvaluesBC3(
  R1: number,
  R2: number,
  H1: number,
  H2: number,
  N: number,
  tol = DEFAULT_TOL,
  maxIter = DEFAULT_MAX_ITER,
): number[] {
  // Roots lie roughly π/(R2-R1) apart; scan with fine step
  const step = Math.PI / (R2 - R1) / 4;
  const maxP = (N + 5) * Math.PI / (R2 - R1);

  const roots: number[] = [];
  const f = (p: number) => hollowCylF(p, R1, R2, H1, H2);

  let pPrev = 1e-6;
  let fPrev = f(pPrev);

  for (let p = pPrev + step; roots.length < N && p <= maxP; p += step) {
    const fCur = f(p);
    if (fPrev * fCur < 0) {
      // Bisect to find root bracket
      let lo = pPrev, hi = p;
      for (let iter = 0; iter < 60; iter++) {
        const mid = (lo + hi) / 2;
        if (f(lo) * f(mid) <= 0) hi = mid;
        else lo = mid;
        if (hi - lo < tol) break;
      }
      const root = (lo + hi) / 2;
      if (roots.length === 0 || root - roots[roots.length - 1] > tol * 10) {
        roots.push(root);
      }
    }
    pPrev = p;
    fPrev = fCur;
  }

  if (roots.length < N) {
    throw new Error(
      `hollowCylinderEigenvaluesBC3: found only ${roots.length}/${N} roots — increase maxP or decrease step`,
    );
  }

  return roots.slice(0, N);
}

/**
 * Spatial basis function W₀(pₙ, r) for hollow cylinder BC III.
 * Luikov, Ch. VI §7, p. 255, Eq. 7.
 */
export function hollowCylW0(
  p: number,
  r: number,
  R1: number,
  H1: number, // α₁/λ
): number {
  const j0r1 = besselJ0(p * R1), j1r1 = besselJ1(p * R1);
  const y0r1 = besselY0(p * R1), y1r1 = besselY1(p * R1);
  const factorY = -(H1 * y0r1 + p * y1r1);
  const factorJ =   H1 * j0r1 + p * j1r1;
  return factorY * besselJ0(p * r) + factorJ * besselY0(p * r);
}
