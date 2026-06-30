/**
 * BC III eigenvalues via Brent's method root-finding.
 *
 * Each geometry has a transcendental characteristic equation.
 * Roots are found per-branch using brentq (from numeric.util) which is
 * robust by design — no bracketing failures, no Newton divergence.
 *
 * References:
 *   Plate:   Luikov, Ch. VI §3, p. 195, Eq. 6.3.17  — μ·tan(μ) = Bi
 *   Cylinder: Luikov, Ch. VI §6, p. 240, Eq. 8/9     — μ·J₁(μ) − Bi·J₀(μ) = 0
 *   Sphere:  Luikov, Ch. VI §5, p. 224, Eq. 6.5.12   — tan(μ) = μ/(1−Bi)
 */
import { besselJ0, besselJ1, besselJ0Roots } from '../../../common/utils/bessel.util';
import { brentq, newtonPolish } from '../../../common/utils/root-finding.util';

const DEFAULT_TOL = 1e-12;

// ─── Plate ────────────────────────────────────────────────────────────────────

/**
 * f(μ) = μ·sin(μ) − Bi·cos(μ)  ⟺  μ·tan(μ) = Bi.
 * Root of the n-th branch lies strictly in ((n−1)π, (n−0.5)π).
 */
function platef(mu: number, Bi: number): number {
  return mu * Math.sin(mu) - Bi * Math.cos(mu);
}

/**
 * N positive roots of the plate BC III eigenvalue equation (μ·tan(μ) = Bi).
 */
export function plateEigenvaluesBC3(
  Bi: number,
  N: number,
  tol = DEFAULT_TOL,
): number[] {
  const df = (mu: number) => (1 + Bi) * Math.sin(mu) + mu * Math.cos(mu);
  return Array.from({ length: N }, (_, i) => {
    const n  = i + 1;
    const lo = (n - 1) * Math.PI + 1e-10;
    const hi = (n - 0.5) * Math.PI - 1e-10;
    const x0 = brentq((mu) => platef(mu, Bi), lo, hi, tol).root;
    return newtonPolish((mu) => platef(mu, Bi), df, x0);
  });
}

// ─── Cylinder ─────────────────────────────────────────────────────────────────

/**
 * f(μ) = μ·J₁(μ) − Bi·J₀(μ)  (cylinder BC III eigenvalue equation).
 * Luikov, Ch. VI §6, p. 240, Eq. 8.
 */
function cylinderf(mu: number, Bi: number): number {
  return mu * besselJ1(mu) - Bi * besselJ0(mu);
}

/**
 * N positive roots of the cylinder BC III eigenvalue equation.
 * Brackets derived from accurate J₀ zeros (besselJ0Roots uses McMahon + Newton).
 */
export function cylinderEigenvaluesBC3(
  Bi: number,
  N: number,
  tol = DEFAULT_TOL,
): number[] {
  const j0Zeros = besselJ0Roots(N + 1); // accurate zeros of J₀ for bracketing
  const df = (mu: number) => mu * besselJ0(mu) + Bi * besselJ1(mu);
  return Array.from({ length: N }, (_, i) => {
    const n  = i + 1;
    const lo = n === 1 ? 1e-8 : j0Zeros[n - 2] + 1e-8;
    const hi = j0Zeros[n - 1] - 1e-8;
    const x0 = brentq((mu) => cylinderf(mu, Bi), lo, hi, tol).root;
    return newtonPolish((mu) => cylinderf(mu, Bi), df, x0);
  });
}

// ─── Sphere ───────────────────────────────────────────────────────────────────

/**
 * f(μ) = μ·cos(μ) − (1−Bi)·sin(μ)  ⟺  tan(μ) = μ/(1−Bi).
 * Root of the n-th branch lies strictly in ((n−1)π, nπ).
 */
function spheref(mu: number, Bi: number): number {
  return mu * Math.cos(mu) - (1 - Bi) * Math.sin(mu);
}

/**
 * N positive roots of the sphere BC III eigenvalue equation.
 */
export function sphereEigenvaluesBC3(
  Bi: number,
  N: number,
  tol = DEFAULT_TOL,
): number[] {
  const df = (mu: number) => Bi * Math.cos(mu) - mu * Math.sin(mu);
  return Array.from({ length: N }, (_, i) => {
    const n  = i + 1;
    const lo = (n - 1) * Math.PI + 1e-10;
    const hi = n * Math.PI - 1e-10;
    const x0 = brentq((mu) => spheref(mu, Bi), lo, hi, tol).root;
    return newtonPolish((mu) => spheref(mu, Bi), df, x0);
  });
}

// ─── Cache helper (used by series solvers) ────────────────────────────────────

export type BC3EigenFn = (Bi: number, N: number) => number[];

export function getBC3EigenFn(geometry: 'plate' | 'cylinder' | 'sphere'): BC3EigenFn {
  switch (geometry) {
    case 'plate':    return plateEigenvaluesBC3;
    case 'cylinder': return cylinderEigenvaluesBC3;
    case 'sphere':   return sphereEigenvaluesBC3;
    default: throw new Error(`getBC3EigenFn: unknown geometry '${geometry}'`);
  }
}
