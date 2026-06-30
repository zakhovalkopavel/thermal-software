/**
 * BC III Fourier series solvers (convective, 0.1 < Bi < 100).
 *
 * Excess temperature scale: ϑ(x,τ) = Tc − T(x,τ)
 * So: T(x,τ) = Tc − ϑ(x,τ)
 *
 * Covers three geometries × three initial profiles:
 *   Geometries:      plate, cylinder, sphere
 *   Initial profiles: uniform, parabolic, arbitrary
 *
 * References:
 *   Plate:   Luikov Ch. VI §3 (pp. 187–212)
 *   Cylinder: Luikov Ch. VI §6 (pp. 239–253)
 *   Sphere:  Luikov Ch. VI §5 (pp. 223–237)
 */
import {
  plateEigenvaluesBC3,
  cylinderEigenvaluesBC3,
  sphereEigenvaluesBC3,
} from './eigenvalues-bc3.util';
import { besselJ0, besselJ1 } from '../../../common/utils/bessel.util';

const DEFAULT_N       = 100;
const SIMPSON_DEFAULT = 128;

// ─── Simpson's rule (odd number of intervals ⟹ even number of sub-panels) ────

function simpsonIntegral(
  f: (x: number) => number,
  a: number,
  b: number,
  n: number, // must be even
): number {
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 === 0 ? 2 : 4) * f(a + i * h);
  return (h / 3) * s;
}

function ensureEven(n: number): number {
  return n % 2 === 0 ? n : n + 1;
}

// ─── sinc limit ───────────────────────────────────────────────────────────────

function sincMu(u: number): number {
  return Math.abs(u) < 1e-12 ? 1 : Math.sin(u) / u;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLATE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Plate BC III amplitude coefficient.
 * Aₙ = 2·sin(μₙ) / (μₙ + sin(μₙ)·cos(μₙ))
 * Luikov Ch. VI §3 p.196 Eq. 6.3.20.
 */
function plateAn(mu: number): number {
  return 2 * Math.sin(mu) / (mu + Math.sin(mu) * Math.cos(mu));
}

/**
 * Plate BC III volumetric coefficient.
 * Bₙ = 2·Bi² / (μₙ²·(Bi² + Bi + μₙ²))
 * Luikov Ch. VI §3 p.211 Eq. 6.3.44.
 */
function plateBn(mu: number, Bi: number): number {
  return 2 * Bi * Bi / (mu * mu * (Bi * Bi + Bi + mu * mu));
}

/**
 * Uniform initial profile: compute local temperature at relDepth.
 *
 * T(x,τ) = Tc − (Tc−T0)·Σ Aₙ·cos(μₙ·x/R)·exp(−μₙ²·Fo)
 * (Excess form: ϑ₀ = Tc−T0; ϑ = (Tc−T0)·Σ Aₙ·cos·exp)
 */
export function plateLocalBC3Uniform(
  relDepth: number,
  Fo: number,
  Bi: number,
  N = DEFAULT_N,
): number {
  const mus = plateEigenvaluesBC3(Bi, N);
  let sum = 0;
  for (const mu of mus) sum += plateAn(mu) * Math.cos(mu * relDepth) * Math.exp(-mu * mu * Fo);
  return sum; // = (T(x,τ)−Tc) / (T0−Tc)  (dimensionless excess, 0→1 scale inverted)
}

/** Plate BC III mean coefficient: Θ̄ = Σ Bₙ·exp(−μₙ²·Fo) */
export function plateMeanBC3Uniform(Fo: number, Bi: number, N = DEFAULT_N): number {
  const mus = plateEigenvaluesBC3(Bi, N);
  let sum = 0;
  for (const mu of mus) sum += plateBn(mu, Bi) * Math.exp(-mu * mu * Fo);
  return sum;
}

/**
 * Absolute temperature at normalised depth (uniform initial profile).
 * T(x,τ) = Tc − (Tc−T0)·Σ ...
 */
export function plateTempBC3Uniform(
  relDepth: number,
  Fo: number,
  Bi: number,
  T0: number,
  Tc: number,
  N = DEFAULT_N,
): number {
  return Tc - (Tc - T0) * plateLocalBC3Uniform(relDepth, Fo, Bi, N);
}

export function plateMeanTempBC3Uniform(
  Fo: number, Bi: number, T0: number, Tc: number, N = DEFAULT_N,
): number {
  return Tc - (Tc - T0) * plateMeanBC3Uniform(Fo, Bi, N);
}

/**
 * Plate BC III — parabolic initial profile.
 * Uses analytical modifier Cm (bypasses Simpson's rule).
 * Cm = ϑ_surf − 2(ϑ_ctr − ϑ_surf)·(1/Bi − 1/μm²)
 * Luikov Ch. VI §3 p.212, Eq. 6.3.48.
 */
export function plateTempBC3Parabolic(
  relDepth: number,
  Fo: number,
  Bi: number,
  T0Ctr: number,
  T0Surf: number,
  Tc: number,
  N = DEFAULT_N,
): number {
  const mus = plateEigenvaluesBC3(Bi, N);
  const vCtr  = Tc - T0Ctr;
  const vSurf = Tc - T0Surf;
  let sum = 0;
  for (const mu of mus) {
    const Cm = vSurf - 2 * (vCtr - vSurf) * (1 / Bi - 1 / (mu * mu));
    sum += Cm * plateAn(mu) * Math.cos(mu * relDepth) * Math.exp(-mu * mu * Fo);
  }
  return Tc - sum;
}

export function plateMeanTempBC3Parabolic(
  Fo: number, Bi: number, T0Ctr: number, T0Surf: number, Tc: number, N = DEFAULT_N,
): number {
  const mus = plateEigenvaluesBC3(Bi, N);
  const vCtr  = Tc - T0Ctr;
  const vSurf = Tc - T0Surf;
  let sum = 0;
  for (const mu of mus) {
    const Cm = vSurf - 2 * (vCtr - vSurf) * (1 / Bi - 1 / (mu * mu));
    sum += Cm * plateBn(mu, Bi) * Math.exp(-mu * mu * Fo);
  }
  return Tc - sum;
}

export function plateTempBC3ArbitraryAbs(
  relDepth: number,
  Fo: number,
  Bi: number,
  R: number,
  f1: (x: number) => number,
  Tc: number,
  N = DEFAULT_N,
  simpsonN = SIMPSON_DEFAULT,
): number {
  const mus = plateEigenvaluesBC3(Bi, N);
  const sN  = ensureEven(simpsonN);
  let sum = 0;
  for (const mu of mus) {
    const integral = simpsonIntegral((x) => f1(x) * Math.cos(mu * x / R), 0, R, sN);
    const Dm = (2 * mu * Math.sin(mu)) / (R * (mu - Math.sin(mu) * Math.cos(mu))) * integral;
    sum += Dm * Math.cos(mu * relDepth) * Math.exp(-mu * mu * Fo);
  }
  return Tc - sum;
}

export function plateMeanTempBC3ArbitraryAbs(
  Fo: number, Bi: number, R: number, f1: (x: number) => number, Tc: number,
  N = DEFAULT_N, simpsonN = SIMPSON_DEFAULT,
): number {
  const mus = plateEigenvaluesBC3(Bi, N);
  const sN  = ensureEven(simpsonN);
  let sum = 0;
  for (const mu of mus) {
    const integral = simpsonIntegral((x) => f1(x) * Math.cos(mu * x / R), 0, R, sN);
    const Dm = (2 * mu * Math.sin(mu)) / (R * (mu - Math.sin(mu) * Math.cos(mu))) * integral;
    sum += Dm * (Math.sin(mu) / mu) * Math.exp(-mu * mu * Fo);
  }
  return Tc - sum;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CYLINDER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Cylinder BC III amplitude coefficient.
 * Aₙ = 2·Bi / (J₀(μₙ)·(μₙ² + Bi²))
 * Luikov Ch. VI §6 p.245, Eq. 27.
 */
function cylinderAn(mu: number, Bi: number): number {
  return 2 * Bi / (besselJ0(mu) * (mu * mu + Bi * Bi));
}

/**
 * Cylinder BC III volumetric coefficient.
 * Bₙ = 4·Bi² / (μₙ²·(μₙ² + Bi²))
 * Luikov Ch. VI §6 p.253, Eq. 33.
 */
function cylinderBn(mu: number, Bi: number): number {
  return 4 * Bi * Bi / (mu * mu * (mu * mu + Bi * Bi));
}

export function cylinderLocalBC3Uniform(relR: number, Fo: number, Bi: number, N = DEFAULT_N): number {
  const mus = cylinderEigenvaluesBC3(Bi, N);
  let sum = 0;
  for (const mu of mus) sum += cylinderAn(mu, Bi) * besselJ0(mu * relR) * Math.exp(-mu * mu * Fo);
  return sum;
}

export function cylinderMeanBC3Uniform(Fo: number, Bi: number, N = DEFAULT_N): number {
  const mus = cylinderEigenvaluesBC3(Bi, N);
  let sum = 0;
  for (const mu of mus) sum += cylinderBn(mu, Bi) * Math.exp(-mu * mu * Fo);
  return sum;
}

export function cylinderTempBC3Uniform(
  relR: number, Fo: number, Bi: number, T0: number, Tc: number, N = DEFAULT_N,
): number {
  return Tc - (Tc - T0) * cylinderLocalBC3Uniform(relR, Fo, Bi, N);
}

export function cylinderMeanTempBC3Uniform(
  Fo: number, Bi: number, T0: number, Tc: number, N = DEFAULT_N,
): number {
  return Tc - (Tc - T0) * cylinderMeanBC3Uniform(Fo, Bi, N);
}

/**
 * Cylinder BC III — parabolic initial profile.
 * Cn = Cn* · An · J₀(μₙ)
 * Cn* = ϑ_surf − 2(ϑ_ctr − ϑ_surf)·(1/Bi − 2/μₙ²)
 * Luikov Ch. VI §6 §4.3.
 */
export function cylinderTempBC3Parabolic(
  relR: number, Fo: number, Bi: number,
  T0Ctr: number, T0Surf: number, Tc: number, N = DEFAULT_N,
): number {
  const mus = cylinderEigenvaluesBC3(Bi, N);
  const vCtr  = Tc - T0Ctr;
  const vSurf = Tc - T0Surf;
  let sum = 0;
  for (const mu of mus) {
    const CnStar = vSurf - 2 * (vCtr - vSurf) * (1 / Bi - 2 / (mu * mu));
    const Cn = CnStar * cylinderAn(mu, Bi) * besselJ0(mu);
    sum += Cn * besselJ0(mu * relR) * Math.exp(-mu * mu * Fo);
  }
  return Tc - sum;
}

export function cylinderMeanTempBC3Parabolic(
  Fo: number, Bi: number, T0Ctr: number, T0Surf: number, Tc: number, N = DEFAULT_N,
): number {
  const mus = cylinderEigenvaluesBC3(Bi, N);
  const vCtr  = Tc - T0Ctr;
  const vSurf = Tc - T0Surf;
  let sum = 0;
  for (const mu of mus) {
    const CnStar = vSurf - 2 * (vCtr - vSurf) * (1 / Bi - 2 / (mu * mu));
    const Cn = CnStar * cylinderBn(mu, Bi);
    sum += Cn * Math.exp(-mu * mu * Fo);
  }
  return Tc - sum;
}

/**
 * Cylinder BC III — arbitrary initial profile f(r).
 * Cn = 2 / (R²·[J₀²(μₙ)+J₁²(μₙ)]) · ∫₀ᴿ r·f₁(r)·J₀(μₙ·r/R) dr
 * Luikov Ch. VI §6 p.242.
 */
export function cylinderTempBC3ArbitraryAbs(
  relR: number, Fo: number, Bi: number, R: number,
  f1: (r: number) => number, Tc: number,
  N = DEFAULT_N, simpsonN = SIMPSON_DEFAULT,
): number {
  const mus = cylinderEigenvaluesBC3(Bi, N);
  const sN  = ensureEven(simpsonN);
  let sum = 0;
  for (const mu of mus) {
    const j0mu = besselJ0(mu), j1mu = besselJ1(mu);
    const norm = R * R * (j0mu * j0mu + j1mu * j1mu);
    const integral = simpsonIntegral((r) => r * f1(r) * besselJ0(mu * r / R), 0, R, sN);
    const Cn = 2 / norm * integral;
    sum += Cn * besselJ0(mu * relR) * Math.exp(-mu * mu * Fo);
  }
  return Tc - sum;
}

export function cylinderMeanTempBC3ArbitraryAbs(
  Fo: number, Bi: number, R: number,
  f1: (r: number) => number, Tc: number,
  N = DEFAULT_N, simpsonN = SIMPSON_DEFAULT,
): number {
  const mus = cylinderEigenvaluesBC3(Bi, N);
  const sN  = ensureEven(simpsonN);
  let sum = 0;
  for (const mu of mus) {
    const j0mu = besselJ0(mu), j1mu = besselJ1(mu);
    const norm = R * R * (j0mu * j0mu + j1mu * j1mu);
    const integral = simpsonIntegral((r) => r * f1(r) * besselJ0(mu * r / R), 0, R, sN);
    const Cn = 2 / norm * integral;
    sum += Cn * (2 * besselJ1(mu) / mu) * Math.exp(-mu * mu * Fo);
  }
  return Tc - sum;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPHERE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Sphere BC III amplitude coefficient.
 * Aₙ = (−1)^(n+1)·2·Bi·√(μₙ²+(Bi−1)²) / (μₙ²+Bi²−Bi)
 * Luikov Ch. VI §5 p.228, Eq. 6.5.29.
 */
function sphereAn(mu: number, Bi: number, n: number): number {
  const sign = n % 2 === 1 ? 1 : -1;
  return sign * 2 * Bi * Math.sqrt(mu * mu + (Bi - 1) ** 2) / (mu * mu + Bi * Bi - Bi);
}

/**
 * Sphere BC III volumetric coefficient.
 * Bₙ = 6·Bi² / (μₙ²·(μₙ²+Bi²−Bi))
 * Luikov Ch. VI §5 p.237, Eq. 6.5.49.
 */
function sphereBn(mu: number, Bi: number): number {
  return 6 * Bi * Bi / (mu * mu * (mu * mu + Bi * Bi - Bi));
}

export function sphereLocalBC3Uniform(relR: number, Fo: number, Bi: number, N = DEFAULT_N): number {
  const mus = sphereEigenvaluesBC3(Bi, N);
  let sum = 0;
  for (let n = 0; n < N; n++) {
    const mu = mus[n];
    sum += sphereAn(mu, Bi, n + 1) * sincMu(mu * relR) * Math.exp(-mu * mu * Fo);
  }
  return sum;
}

export function sphereMeanBC3Uniform(Fo: number, Bi: number, N = DEFAULT_N): number {
  const mus = sphereEigenvaluesBC3(Bi, N);
  let sum = 0;
  for (const mu of mus) sum += sphereBn(mu, Bi) * Math.exp(-mu * mu * Fo);
  return sum;
}

export function sphereTempBC3Uniform(
  relR: number, Fo: number, Bi: number, T0: number, Tc: number, N = DEFAULT_N,
): number {
  return Tc - (Tc - T0) * sphereLocalBC3Uniform(relR, Fo, Bi, N);
}

export function sphereMeanTempBC3Uniform(
  Fo: number, Bi: number, T0: number, Tc: number, N = DEFAULT_N,
): number {
  return Tc - (Tc - T0) * sphereMeanBC3Uniform(Fo, Bi, N);
}

/**
 * Sphere BC III — parabolic initial profile.
 * Cn = ϑ_surf − 2(ϑ_ctr − ϑ_surf)·(1/Bi − 3/μₙ²)
 * T(r,τ) = Tc − Σ Cn·Aₙ·sin(μₙ·r/R)/(r·μₙ/R)·exp(−μₙ²·Fo)
 * Luikov Ch. VI §5 §4.
 */
export function sphereTempBC3Parabolic(
  relR: number, Fo: number, Bi: number,
  T0Ctr: number, T0Surf: number, Tc: number, N = DEFAULT_N,
): number {
  const mus = sphereEigenvaluesBC3(Bi, N);
  const vCtr  = Tc - T0Ctr;
  const vSurf = Tc - T0Surf;
  let sum = 0;
  for (let n = 0; n < N; n++) {
    const mu = mus[n];
    const Cn = vSurf - 2 * (vCtr - vSurf) * (1 / Bi - 3 / (mu * mu));
    sum += Cn * sphereAn(mu, Bi, n + 1) * sincMu(mu * relR) * Math.exp(-mu * mu * Fo);
  }
  return Tc - sum;
}

export function sphereMeanTempBC3Parabolic(
  Fo: number, Bi: number, T0Ctr: number, T0Surf: number, Tc: number, N = DEFAULT_N,
): number {
  const mus = sphereEigenvaluesBC3(Bi, N);
  const vCtr  = Tc - T0Ctr;
  const vSurf = Tc - T0Surf;
  let sum = 0;
  for (const mu of mus) {
    const Cn = vSurf - 2 * (vCtr - vSurf) * (1 / Bi - 3 / (mu * mu));
    sum += Cn * sphereBn(mu, Bi) * Math.exp(-mu * mu * Fo);
  }
  return Tc - sum;
}

/**
 * Sphere BC III — arbitrary initial profile f(r).
 * Cn = 2μₙ / (R·(μₙ−sin(μₙ)·cos(μₙ))) · ∫₀ᴿ r·f₁(r)·sin(μₙ·r/R) dr
 * Luikov Ch. VI §5 p.226.
 */
export function sphereTempBC3ArbitraryAbs(
  relR: number, Fo: number, Bi: number, R: number,
  f1: (r: number) => number, Tc: number,
  N = DEFAULT_N, simpsonN = SIMPSON_DEFAULT,
): number {
  const mus = sphereEigenvaluesBC3(Bi, N);
  const sN  = ensureEven(simpsonN);
  let sum = 0;
  for (let n = 0; n < N; n++) {
    const mu = mus[n];
    const denom = R * (mu - Math.sin(mu) * Math.cos(mu));
    const integral = simpsonIntegral((r) => r * f1(r) * Math.sin(mu * r / R), 0, R, sN);
    const Cn = (2 * mu / denom) * integral;
    // ϑ(r,τ) = Σ Cₙ·sin(μₙr/R)/r·exp  (HC-10 §3.2)
    // With relR = r/R: sin(μₙ·relR)/(relR·R); limit at r=0 is μₙ/R
    const profile = relR > 1e-12 ? Math.sin(mu * relR) / (relR * R) : mu / R;
    sum += Cn * profile * Math.exp(-mu * mu * Fo);
  }
  return Tc - sum;
}

export function sphereMeanTempBC3ArbitraryAbs(
  Fo: number, Bi: number, R: number,
  f1: (r: number) => number, Tc: number,
  N = DEFAULT_N, simpsonN = SIMPSON_DEFAULT,
): number {
  const mus = sphereEigenvaluesBC3(Bi, N);
  const sN  = ensureEven(simpsonN);
  let sum = 0;
  for (const mu of mus) {
    const denom = R * (mu - Math.sin(mu) * Math.cos(mu));
    const integral = simpsonIntegral((r) => r * f1(r) * Math.sin(mu * r / R), 0, R, sN);
    const Cn = (2 * mu / denom) * integral;
    const meanCoeff = 3 * (Math.sin(mu) - mu * Math.cos(mu)) / (R * mu * mu);
    sum += Cn * meanCoeff * Math.exp(-mu * mu * Fo);
  }
  return Tc - sum;
}
