/**
 * BC III Fourier series — sphere (convective, 0.1 < Bi < 100).
 * Excess temperature scale: ϑ = Tc − T.  Stateless — no DI.
 */
import { EigenvaluesBc3 } from './eigenvalues-bc3';
import { simpson } from '../../../common/utils/quadrature';
import { SERIES_TERMS_DEFAULT, SIMPSON_INTERVALS_DEFAULT } from '../constants/thermal-distribution.constants';

export class SeriesBc3Sphere {
  private static sincMu(u: number): number {
    return Math.abs(u) < 1e-12 ? 1 : Math.sin(u) / u;
  }


  /**
   * Sphere BC III amplitude coefficient.
   * Aₙ = (−1)^(n+1)·2·Bi·√(μₙ²+(Bi−1)²) / (μₙ²+Bi²−Bi)
   * Luikov Ch. VI §5 p.228, Eq. 6.5.29.
   */
  private static sphereAn(mu: number, Bi: number, n: number): number {
  const sign = n % 2 === 1 ? 1 : -1;
  return sign * 2 * Bi * Math.sqrt(mu * mu + (Bi - 1) ** 2) / (mu * mu + Bi * Bi - Bi);
  }

  /**
   * Sphere BC III volumetric coefficient.
   * Bₙ = 6·Bi² / (μₙ²·(μₙ²+Bi²−Bi))
   * Luikov Ch. VI §5 p.237, Eq. 6.5.49.
   */
  private static sphereBn(mu: number, Bi: number): number {
  return 6 * Bi * Bi / (mu * mu * (mu * mu + Bi * Bi - Bi));
  }

  static sphereLocalBC3Uniform(relR: number, Fo: number, Bi: number, N = SERIES_TERMS_DEFAULT): number {
  const mus = EigenvaluesBc3.sphereEigenvaluesBC3(Bi, N);
  let sum = 0;
  for (let n = 0; n < N; n++) {
    const mu = mus[n];
    sum += SeriesBc3Sphere.sphereAn(mu, Bi, n + 1) * SeriesBc3Sphere.sincMu(mu * relR) * Math.exp(-mu * mu * Fo);
  }
  return sum;
  }

  static sphereMeanBC3Uniform(Fo: number, Bi: number, N = SERIES_TERMS_DEFAULT): number {
  const mus = EigenvaluesBc3.sphereEigenvaluesBC3(Bi, N);
  let sum = 0;
  for (const mu of mus) sum += SeriesBc3Sphere.sphereBn(mu, Bi) * Math.exp(-mu * mu * Fo);
  return sum;
  }

  static sphereTempBC3Uniform(
  relR: number, Fo: number, Bi: number, T0: number, Tc: number, N = SERIES_TERMS_DEFAULT,
  ): number {
  return Tc - (Tc - T0) * SeriesBc3Sphere.sphereLocalBC3Uniform(relR, Fo, Bi, N);
  }

  static sphereMeanTempBC3Uniform(
  Fo: number, Bi: number, T0: number, Tc: number, N = SERIES_TERMS_DEFAULT,
  ): number {
  return Tc - (Tc - T0) * SeriesBc3Sphere.sphereMeanBC3Uniform(Fo, Bi, N);
  }

  /**
   * Sphere BC III — parabolic initial profile.
   * Cn = ϑ_surf − 2(ϑ_ctr − ϑ_surf)·(1/Bi − 3/μₙ²)
   * T(r,τ) = Tc − Σ Cn·Aₙ·sin(μₙ·r/R)/(r·μₙ/R)·exp(−μₙ²·Fo)
   * Luikov Ch. VI §5 §4.
   */
  static sphereTempBC3Parabolic(
  relR: number, Fo: number, Bi: number,
  T0Ctr: number, T0Surf: number, Tc: number, N = SERIES_TERMS_DEFAULT,
  ): number {
  const mus = EigenvaluesBc3.sphereEigenvaluesBC3(Bi, N);
  const vCtr  = Tc - T0Ctr;
  const vSurf = Tc - T0Surf;
  let sum = 0;
  for (let n = 0; n < N; n++) {
    const mu = mus[n];
    const Cn = vSurf - 2 * (vCtr - vSurf) * (1 / Bi - 3 / (mu * mu));
    sum += Cn * SeriesBc3Sphere.sphereAn(mu, Bi, n + 1) * SeriesBc3Sphere.sincMu(mu * relR) * Math.exp(-mu * mu * Fo);
  }
  return Tc - sum;
  }

  static sphereMeanTempBC3Parabolic(
  Fo: number, Bi: number, T0Ctr: number, T0Surf: number, Tc: number, N = SERIES_TERMS_DEFAULT,
  ): number {
  const mus = EigenvaluesBc3.sphereEigenvaluesBC3(Bi, N);
  const vCtr  = Tc - T0Ctr;
  const vSurf = Tc - T0Surf;
  let sum = 0;
  for (const mu of mus) {
    const Cn = vSurf - 2 * (vCtr - vSurf) * (1 / Bi - 3 / (mu * mu));
    sum += Cn * SeriesBc3Sphere.sphereBn(mu, Bi) * Math.exp(-mu * mu * Fo);
  }
  return Tc - sum;
  }

  /**
   * Sphere BC III — arbitrary initial profile f(r).
   * Cn = 2μₙ / (R·(μₙ−sin(μₙ)·cos(μₙ))) · ∫₀ᴿ r·f₁(r)·sin(μₙ·r/R) dr
   * Luikov Ch. VI §5 p.226.
   */
  static sphereTempBC3ArbitraryAbs(
  relR: number, Fo: number, Bi: number, R: number,
  f1: (r: number) => number, Tc: number,
  N = SERIES_TERMS_DEFAULT, simpsonN = SIMPSON_INTERVALS_DEFAULT,
  ): number {
  const mus = EigenvaluesBc3.sphereEigenvaluesBC3(Bi, N);
  let sum = 0;
  for (let n = 0; n < N; n++) {
    const mu = mus[n];
    const denom = R * (mu - Math.sin(mu) * Math.cos(mu));
    const integral = simpson((r) => r * f1(r) * Math.sin(mu * r / R), 0, R, simpsonN);
    const Cn = (2 * mu / denom) * integral;
    // ϑ(r,τ) = Σ Cₙ·sin(μₙr/R)/r·exp  (HC-10 §3.2)
    // With relR = r/R: sin(μₙ·relR)/(relR·R); limit at r=0 is μₙ/R
    const profile = relR > 1e-12 ? Math.sin(mu * relR) / (relR * R) : mu / R;
    sum += Cn * profile * Math.exp(-mu * mu * Fo);
  }
  return Tc - sum;
  }

  static sphereMeanTempBC3ArbitraryAbs(
  Fo: number, Bi: number, R: number,
  f1: (r: number) => number, Tc: number,
  N = SERIES_TERMS_DEFAULT, simpsonN = SIMPSON_INTERVALS_DEFAULT,
  ): number {
  const mus = EigenvaluesBc3.sphereEigenvaluesBC3(Bi, N);
  let sum = 0;
  for (const mu of mus) {
    const denom = R * (mu - Math.sin(mu) * Math.cos(mu));
    const integral = simpson((r) => r * f1(r) * Math.sin(mu * r / R), 0, R, simpsonN);
    const Cn = (2 * mu / denom) * integral;
    const meanCoeff = 3 * (Math.sin(mu) - mu * Math.cos(mu)) / (R * mu * mu);
    sum += Cn * meanCoeff * Math.exp(-mu * mu * Fo);
  }
  return Tc - sum;
  }
}
