/**
 * BC III Fourier series — plate (convective, 0.1 < Bi < 100).
 * Excess temperature scale: ϑ = Tc − T.  Stateless — no DI.
 */
import { EigenvaluesBc3 } from './eigenvalues-bc3';
import { simpson } from '../../../common/utils/quadrature';
import { SERIES_TERMS_DEFAULT, SIMPSON_INTERVALS_DEFAULT } from '../constants/thermal-distribution.constants';

export class SeriesBc3Plate {

  /**
   * Plate BC III amplitude coefficient.
   * Aₙ = 2·sin(μₙ) / (μₙ + sin(μₙ)·cos(μₙ))
   * Luikov Ch. VI §3 p.196 Eq. 6.3.20.
   */
  private static plateAn(mu: number): number {
  return 2 * Math.sin(mu) / (mu + Math.sin(mu) * Math.cos(mu));
  }

  /**
   * Plate BC III volumetric coefficient.
   * Bₙ = 2·Bi² / (μₙ²·(Bi² + Bi + μₙ²))
   * Luikov Ch. VI §3 p.211 Eq. 6.3.44.
   */
  private static plateBn(mu: number, Bi: number): number {
  return 2 * Bi * Bi / (mu * mu * (Bi * Bi + Bi + mu * mu));
  }

  /**
   * Uniform initial profile: compute local temperature at relDepth.
   *
   * T(x,τ) = Tc − (Tc−T0)·Σ Aₙ·cos(μₙ·x/R)·exp(−μₙ²·Fo)
   * (Excess form: ϑ₀ = Tc−T0; ϑ = (Tc−T0)·Σ Aₙ·cos·exp)
   */
  static plateLocalBC3Uniform(
  relDepth: number,
  Fo: number,
  Bi: number,
  N = SERIES_TERMS_DEFAULT,
  ): number {
  const mus = EigenvaluesBc3.plateEigenvaluesBC3(Bi, N);
  let sum = 0;
  for (const mu of mus) sum += SeriesBc3Plate.plateAn(mu) * Math.cos(mu * relDepth) * Math.exp(-mu * mu * Fo);
  return sum; // = (T(x,τ)−Tc) / (T0−Tc)  (dimensionless excess, 0→1 scale inverted)
  }

  /** Plate BC III mean coefficient: Θ̄ = Σ Bₙ·exp(−μₙ²·Fo) */
  static plateMeanBC3Uniform(Fo: number, Bi: number, N = SERIES_TERMS_DEFAULT): number {
  const mus = EigenvaluesBc3.plateEigenvaluesBC3(Bi, N);
  let sum = 0;
  for (const mu of mus) sum += SeriesBc3Plate.plateBn(mu, Bi) * Math.exp(-mu * mu * Fo);
  return sum;
  }

  /**
   * Absolute temperature at normalised depth (uniform initial profile).
   * T(x,τ) = Tc − (Tc−T0)·Σ ...
   */
  static plateTempBC3Uniform(
  relDepth: number,
  Fo: number,
  Bi: number,
  T0: number,
  Tc: number,
  N = SERIES_TERMS_DEFAULT,
  ): number {
  return Tc - (Tc - T0) * SeriesBc3Plate.plateLocalBC3Uniform(relDepth, Fo, Bi, N);
  }

  static plateMeanTempBC3Uniform(
  Fo: number, Bi: number, T0: number, Tc: number, N = SERIES_TERMS_DEFAULT,
  ): number {
  return Tc - (Tc - T0) * SeriesBc3Plate.plateMeanBC3Uniform(Fo, Bi, N);
  }

  /**
   * Plate BC III — parabolic initial profile.
   * Uses analytical modifier Cm (bypasses Simpson's rule).
   * Cm = ϑ_surf − 2(ϑ_ctr − ϑ_surf)·(1/Bi − 1/μm²)
   * Luikov Ch. VI §3 p.212, Eq. 6.3.48.
   */
  static plateTempBC3Parabolic(
  relDepth: number,
  Fo: number,
  Bi: number,
  T0Ctr: number,
  T0Surf: number,
  Tc: number,
  N = SERIES_TERMS_DEFAULT,
  ): number {
  const mus = EigenvaluesBc3.plateEigenvaluesBC3(Bi, N);
  const vCtr  = Tc - T0Ctr;
  const vSurf = Tc - T0Surf;
  let sum = 0;
  for (const mu of mus) {
    const Cm = vSurf - 2 * (vCtr - vSurf) * (1 / Bi - 1 / (mu * mu));
    sum += Cm * SeriesBc3Plate.plateAn(mu) * Math.cos(mu * relDepth) * Math.exp(-mu * mu * Fo);
  }
  return Tc - sum;
  }

  static plateMeanTempBC3Parabolic(
  Fo: number, Bi: number, T0Ctr: number, T0Surf: number, Tc: number, N = SERIES_TERMS_DEFAULT,
  ): number {
  const mus = EigenvaluesBc3.plateEigenvaluesBC3(Bi, N);
  const vCtr  = Tc - T0Ctr;
  const vSurf = Tc - T0Surf;
  let sum = 0;
  for (const mu of mus) {
    const Cm = vSurf - 2 * (vCtr - vSurf) * (1 / Bi - 1 / (mu * mu));
    sum += Cm * SeriesBc3Plate.plateBn(mu, Bi) * Math.exp(-mu * mu * Fo);
  }
  return Tc - sum;
  }

  static plateTempBC3ArbitraryAbs(
  relDepth: number,
  Fo: number,
  Bi: number,
  R: number,
  f1: (x: number) => number,
  Tc: number,
  N = SERIES_TERMS_DEFAULT,
  simpsonN = SIMPSON_INTERVALS_DEFAULT,
  ): number {
  const mus = EigenvaluesBc3.plateEigenvaluesBC3(Bi, N);
  let sum = 0;
  for (const mu of mus) {
    const integral = simpson((x) => f1(x) * Math.cos(mu * x / R), 0, R, simpsonN);
    const Dm = (2 * mu * Math.sin(mu)) / (R * (mu - Math.sin(mu) * Math.cos(mu))) * integral;
    sum += Dm * Math.cos(mu * relDepth) * Math.exp(-mu * mu * Fo);
  }
  return Tc - sum;
  }

  static plateMeanTempBC3ArbitraryAbs(
  Fo: number, Bi: number, R: number, f1: (x: number) => number, Tc: number,
  N = SERIES_TERMS_DEFAULT, simpsonN = SIMPSON_INTERVALS_DEFAULT,
  ): number {
  const mus = EigenvaluesBc3.plateEigenvaluesBC3(Bi, N);
  let sum = 0;
  for (const mu of mus) {
    const integral = simpson((x) => f1(x) * Math.cos(mu * x / R), 0, R, simpsonN);
    const Dm = (2 * mu * Math.sin(mu)) / (R * (mu - Math.sin(mu) * Math.cos(mu))) * integral;
    sum += Dm * (Math.sin(mu) / mu) * Math.exp(-mu * mu * Fo);
  }
  return Tc - sum;
  }

}
