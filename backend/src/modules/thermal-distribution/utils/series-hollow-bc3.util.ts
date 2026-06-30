/**
 * BC III hollow cylinder series solver.
 *
 * Transient temperature distribution in a hollow cylinder with convective
 * boundary conditions on both surfaces (Luikov Ch. VI §7, pp. 254–255).
 *
 *   T(r,τ) = Tc − Σ Eₙ · exp(−a·pₙ²·τ) · W₀(pₙ, r)
 *
 * where W₀ is the spatial basis function and Eₙ are the Fourier coefficients
 * computed from the initial profile via Simpson quadrature (no closed form).
 *
 * Volume average uses Gauss-Legendre quadrature (mandatory — no closed-form mean).
 */
import {
  besselJ0,
  besselJ1,
} from '../../../common/utils/bessel.util';
import { adaptiveIntegrate } from '../../../common/utils/quadrature.util';
import {
  hollowCylinderEigenvaluesBC3,
  hollowCylW0,
} from './eigenvalues-hollow-bc3.util';

const DEFAULT_N       = 50;
const SIMPSON_DEFAULT = 128;

function ensureEven(n: number): number {
  return n % 2 === 0 ? n : n + 1;
}

function simpsonIntegral(f: (x: number) => number, a: number, b: number, n: number): number {
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 === 0 ? 2 : 4) * f(a + i * h);
  return (h / 3) * s;
}

/**
 * Compute Fourier coefficient Eₙ for one eigenvalue pₙ.
 * Luikov Ch. VI §7, p. 255, Eq. 10.
 *
 *   Eₙ = (π²pₙ²/2) · C² · ∫_{R₁}^{R₂} r·f₁(r)·W₀(pₙ,r) dr
 *        ─────────────────────────────────────────────────────
 *        (pₙ²+H₁²)·A² − (pₙ²+H₂²)·C²
 *
 * where:
 *   A = H₁·J₀(pR₁) + p·J₁(pR₁)
 *   C = H₂·J₀(pR₂) − p·J₁(pR₂)
 */
function computeEn(
  p: number,
  R1: number,
  R2: number,
  H1: number,
  H2: number,
  f1: (r: number) => number,
  simpsonN: number,
): number {
  const A = H1 * besselJ0(p * R1) + p * besselJ1(p * R1);
  const C = H2 * besselJ0(p * R2) - p * besselJ1(p * R2);

  const integral = simpsonIntegral((r) => r * f1(r) * hollowCylW0(p, r, R1, H1), R1, R2, simpsonN);
  const numerator = (Math.PI * Math.PI * p * p / 2) * C * C * integral;
  const denominator = (p * p + H1 * H1) * A * A - (p * p + H2 * H2) * C * C;

  if (Math.abs(denominator) < 1e-30) return 0;
  return numerator / denominator;
}

/**
 * Local temperature T(r, τ) for hollow cylinder (BC III).
 *
 * @param r        Radial coordinate (m), R1 ≤ r ≤ R2
 * @param tau      Time (s)
 * @param R1       Inner radius (m)
 * @param R2       Outer radius (m)
 * @param alpha1   Inner surface HTC (W/(m²·K))
 * @param alpha2   Outer surface HTC (W/(m²·K))
 * @param lambda   Thermal conductivity (W/(m·K))
 * @param a        Thermal diffusivity (m²/s)
 * @param f1       f₁(r) = Tc − f(r) — excess above ambient for the initial profile
 * @param Tc       Ambient / quenching medium temperature (°C)
 * @param N        Number of series terms
 * @param simpsonN Simpson quadrature nodes for Eₙ integrals (must be even)
 */
export function hollowCylinderTempBC3(
  r: number,
  tau: number,
  R1: number,
  R2: number,
  alpha1: number,
  alpha2: number,
  lambda: number,
  a: number,
  f1: (r: number) => number,
  Tc: number,
  N = DEFAULT_N,
  simpsonN = SIMPSON_DEFAULT,
): number {
  const H1 = alpha1 / lambda;
  const H2 = alpha2 / lambda;
  const sN = ensureEven(simpsonN);
  const ps = hollowCylinderEigenvaluesBC3(R1, R2, H1, H2, N);

  let sum = 0;
  for (const p of ps) {
    const En = computeEn(p, R1, R2, H1, H2, f1, sN);
    sum += En * Math.exp(-a * p * p * tau) * hollowCylW0(p, r, R1, H1);
  }
  return Tc - sum;
}

/**
 * Volume-average temperature T̄(τ) for hollow cylinder (BC III).
 * Uses Gauss-Legendre quadrature (N nodes) — no closed-form mean available.
 *
 *   T̄ = 2 / (R2² − R1²) · ∫_{R1}^{R2} T(r,τ) · r dr
 *
 * The integrand contains a sum of W₀(pₙ,r) basis functions (combinations of
 * J₀ and Y₀), which are oscillating — Clenshaw–Curtis via adaptiveIntegrate is used.
 */
export function hollowCylinderMeanTempBC3(
  tau: number,
  R1: number,
  R2: number,
  alpha1: number,
  alpha2: number,
  lambda: number,
  a: number,
  f1: (r: number) => number,
  Tc: number,
  N = DEFAULT_N,
  simpsonN = SIMPSON_DEFAULT,
  nodes = 64,
): number {
  const H1 = alpha1 / lambda;
  const H2 = alpha2 / lambda;
  const sN = ensureEven(simpsonN);
  const ps = hollowCylinderEigenvaluesBC3(R1, R2, H1, H2, N);

  // Pre-compute all Eₙ once
  const Ens = ps.map((p) => computeEn(p, R1, R2, H1, H2, f1, sN));

  // Integrand involves W₀(pₙ, r) = combinations of J₀/Y₀ → oscillating
  const integrand = (r: number): number => {
    let vartheta = 0;
    for (let i = 0; i < ps.length; i++) {
      vartheta += Ens[i] * Math.exp(-a * ps[i] * ps[i] * tau) * hollowCylW0(ps[i], r, R1, H1);
    }
    return (Tc - vartheta) * r;
  };

  const integral = adaptiveIntegrate(integrand, R1, R2, { method: 'auto', nodes });
  return 2 / (R2 * R2 - R1 * R1) * integral;
}
