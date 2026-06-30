/**
 * BC I Fourier series solvers (Dirichlet, Bi → ∞).
 *
 * Dimensionless temperature:
 *   Θ(x,τ) = (T − Ts) / (T₀ − Ts)
 *   T̄(τ)  = Ts + (T₀ − Ts)·Σ Bₙ·exp(−μₙ²·Fo)
 *
 * References:
 *   Plate:   Luikov Ch. IV §3, pp. 86–96 (Eqs 4.3.14, 4.3.25, 4.3.32)
 *   Cylinder: Luikov Ch. IV §5, pp. 106–122 (Eqs 4.5.25–4.5.31)
 *   Sphere:  Luikov Ch. IV §4, pp. 107–113 (Eqs 4.4.18–4.4.37)
 */
import {
  plateEigenvaluesBC1,
  cylinderEigenvaluesBC1,
  sphereEigenvaluesBC1,
} from './eigenvalues-bc1.util';
import { besselJ0, besselJ1 } from '../../../common/utils/bessel.util';

const DEFAULT_N = 100;

// ─── Amplitude coefficients ───────────────────────────────────────────────────

/** Plate BC I amplitude coefficient Aₙ = (−1)^(n+1)·2/μₙ */
function plateAnBC1(mu: number, n: number): number {
  return (n % 2 === 1 ? 1 : -1) * 2 / mu;
}

/** Plate BC I volume-average coefficient Bₙ = 2/μₙ² = 8/[(2n−1)²π²] */
function plateBnBC1(mu: number): number {
  return 2 / (mu * mu);
}

/** Cylinder BC I amplitude coefficient Aₙ = 2 / (μₙ·J₁(μₙ)) */
function cylinderAnBC1(mu: number): number {
  return 2 / (mu * besselJ1(mu));
}

/** Cylinder BC I volume-average coefficient Bₙ = 4/μₙ² */
function cylinderBnBC1(mu: number): number {
  return 4 / (mu * mu);
}

/** Sphere BC I amplitude coefficient Aₙ = 2(−1)^(n+1) */
function sphereAnBC1(n: number): number {
  return 2 * (n % 2 === 1 ? 1 : -1);
}

/** Sphere BC I volume-average coefficient Bₙ = 6/(n²π²) = 6/μₙ² */
function sphereBnBC1(mu: number): number {
  return 6 / (mu * mu);
}

// ─── sin(u)/u with limit at u=0 ───────────────────────────────────────────────

function sincMu(u: number): number {
  return Math.abs(u) < 1e-12 ? 1 : Math.sin(u) / u;
}

// ─── Plate ────────────────────────────────────────────────────────────────────

/**
 * Local dimensionless temperature Θ(x, τ) for infinite plate (BC I).
 *
 * @param relDepth  Normalised depth x/R ∈ [0, 1]  (0 = centre, 1 = surface)
 * @param Fo        Fourier number ā·τ/R²
 * @param N         Number of series terms (default 100)
 */
export function plateLocalBC1(relDepth: number, Fo: number, N = DEFAULT_N): number {
  const mus = plateEigenvaluesBC1(N);
  let sum = 0;
  for (let n = 0; n < N; n++) {
    const mu = mus[n];
    sum += plateAnBC1(mu, n + 1) * Math.cos(mu * relDepth) * Math.exp(-mu * mu * Fo);
  }
  return sum;
}

/** Volume-average dimensionless temperature Θ̄(τ) for infinite plate (BC I). */
export function plateMeanBC1(Fo: number, N = DEFAULT_N): number {
  const mus = plateEigenvaluesBC1(N);
  let sum = 0;
  for (const mu of mus) sum += plateBnBC1(mu) * Math.exp(-mu * mu * Fo);
  return sum;
}

/** Absolute temperature at normalised depth. T = Ts + (T0−Ts)·Θ */
export function plateTempBC1(relDepth: number, Fo: number, T0: number, Ts: number, N = DEFAULT_N): number {
  return Ts + (T0 - Ts) * plateLocalBC1(relDepth, Fo, N);
}

/** Volume-average absolute temperature for plate (BC I). */
export function plateMeanTempBC1(Fo: number, T0: number, Ts: number, N = DEFAULT_N): number {
  return Ts + (T0 - Ts) * plateMeanBC1(Fo, N);
}

// ─── Cylinder ─────────────────────────────────────────────────────────────────

/**
 * Local dimensionless temperature Θ(r, τ) for infinite cylinder (BC I).
 * @param relR  r/R ∈ [0, 1]
 */
export function cylinderLocalBC1(relR: number, Fo: number, N = DEFAULT_N): number {
  const mus = cylinderEigenvaluesBC1(N);
  let sum = 0;
  for (const mu of mus) {
    sum += cylinderAnBC1(mu) * besselJ0(mu * relR) * Math.exp(-mu * mu * Fo);
  }
  return sum;
}

/** Volume-average dimensionless temperature Θ̄(τ) for infinite cylinder (BC I). */
export function cylinderMeanBC1(Fo: number, N = DEFAULT_N): number {
  const mus = cylinderEigenvaluesBC1(N);
  let sum = 0;
  for (const mu of mus) sum += cylinderBnBC1(mu) * Math.exp(-mu * mu * Fo);
  return sum;
}

export function cylinderTempBC1(relR: number, Fo: number, T0: number, Ts: number, N = DEFAULT_N): number {
  return Ts + (T0 - Ts) * cylinderLocalBC1(relR, Fo, N);
}

export function cylinderMeanTempBC1(Fo: number, T0: number, Ts: number, N = DEFAULT_N): number {
  return Ts + (T0 - Ts) * cylinderMeanBC1(Fo, N);
}

// ─── Sphere ───────────────────────────────────────────────────────────────────

/**
 * Local dimensionless temperature Θ(r, τ) for solid sphere (BC I).
 * @param relR  r/R ∈ [0, 1]  (at r=0: sinc limit applied)
 */
export function sphereLocalBC1(relR: number, Fo: number, N = DEFAULT_N): number {
  const mus = sphereEigenvaluesBC1(N);
  let sum = 0;
  for (let n = 0; n < N; n++) {
    const mu = mus[n];
    sum += sphereAnBC1(n + 1) * sincMu(mu * relR) * Math.exp(-mu * mu * Fo);
  }
  return sum;
}

/** Volume-average dimensionless temperature Θ̄(τ) for solid sphere (BC I). */
export function sphereMeanBC1(Fo: number, N = DEFAULT_N): number {
  const mus = sphereEigenvaluesBC1(N);
  let sum = 0;
  for (const mu of mus) sum += sphereBnBC1(mu) * Math.exp(-mu * mu * Fo);
  return sum;
}

export function sphereTempBC1(relR: number, Fo: number, T0: number, Ts: number, N = DEFAULT_N): number {
  return Ts + (T0 - Ts) * sphereLocalBC1(relR, Fo, N);
}

export function sphereMeanTempBC1(Fo: number, T0: number, Ts: number, N = DEFAULT_N): number {
  return Ts + (T0 - Ts) * sphereMeanBC1(Fo, N);
}
