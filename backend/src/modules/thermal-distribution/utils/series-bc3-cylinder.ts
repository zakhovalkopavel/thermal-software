/**
 * BC III Fourier series — cylinder (convective, 0.1 < Bi < 100).
 * Excess temperature scale: ϑ = Tc − T.  Stateless — no DI.
 */
import { EigenvaluesBc3 } from './eigenvalues-bc3';
import { besselJ0, besselJ1 } from '../../../common/utils/bessel';
import { simpson } from '../../../common/utils/quadrature';
import { THERMAL_DISTRIBUTION_CONSTANTS } from '../constants/thermal-distribution.constants';
const { SERIES_TERMS_DEFAULT, SIMPSON_INTERVALS_DEFAULT } = THERMAL_DISTRIBUTION_CONSTANTS;

export class SeriesBc3Cylinder {

  /**
   * Cylinder BC III amplitude coefficient.
   * Aₙ = 2·Bi / (J₀(μₙ)·(μₙ² + Bi²))
   * Luikov Ch. VI §6 p.245, Eq. 27.
   */
  private static cylinderAn(mu: number, Bi: number): number {
  return 2 * Bi / (besselJ0(mu) * (mu * mu + Bi * Bi));
  }

  /**
   * Cylinder BC III volumetric coefficient.
   * Bₙ = 4·Bi² / (μₙ²·(μₙ² + Bi²))
   * Luikov Ch. VI §6 p.253, Eq. 33.
   */
  private static cylinderBn(mu: number, Bi: number): number {
  return 4 * Bi * Bi / (mu * mu * (mu * mu + Bi * Bi));
  }

  static cylinderLocalBC3Uniform(relR: number, Fo: number, Bi: number, N = SERIES_TERMS_DEFAULT): number {
  const mus = EigenvaluesBc3.cylinderEigenvaluesBC3(Bi, N);
  let sum = 0;
  for (const mu of mus) sum += SeriesBc3Cylinder.cylinderAn(mu, Bi) * besselJ0(mu * relR) * Math.exp(-mu * mu * Fo);
  return sum;
  }

  static cylinderMeanBC3Uniform(Fo: number, Bi: number, N = SERIES_TERMS_DEFAULT): number {
  const mus = EigenvaluesBc3.cylinderEigenvaluesBC3(Bi, N);
  let sum = 0;
  for (const mu of mus) sum += SeriesBc3Cylinder.cylinderBn(mu, Bi) * Math.exp(-mu * mu * Fo);
  return sum;
  }

  static cylinderTempBC3Uniform(
  relR: number, Fo: number, Bi: number, T0: number, Tc: number, N = SERIES_TERMS_DEFAULT,
  ): number {
  return Tc - (Tc - T0) * SeriesBc3Cylinder.cylinderLocalBC3Uniform(relR, Fo, Bi, N);
  }

  static cylinderMeanTempBC3Uniform(
  Fo: number, Bi: number, T0: number, Tc: number, N = SERIES_TERMS_DEFAULT,
  ): number {
  return Tc - (Tc - T0) * SeriesBc3Cylinder.cylinderMeanBC3Uniform(Fo, Bi, N);
  }

  /**
   * Cylinder BC III — parabolic initial profile.
   * Cn = Cn* · An · J₀(μₙ)
   * Cn* = ϑ_surf − 2(ϑ_ctr − ϑ_surf)·(1/Bi − 2/μₙ²)
   * Luikov Ch. VI §6 §4.3.
   */
  static cylinderTempBC3Parabolic(
  relR: number, Fo: number, Bi: number,
  T0Ctr: number, T0Surf: number, Tc: number, N = SERIES_TERMS_DEFAULT,
  ): number {
  const mus = EigenvaluesBc3.cylinderEigenvaluesBC3(Bi, N);
  const vCtr  = Tc - T0Ctr;
  const vSurf = Tc - T0Surf;
  let sum = 0;
  for (const mu of mus) {
    const CnStar = vSurf - 2 * (vCtr - vSurf) * (1 / Bi - 2 / (mu * mu));
    const Cn = CnStar * SeriesBc3Cylinder.cylinderAn(mu, Bi) * besselJ0(mu);
    sum += Cn * besselJ0(mu * relR) * Math.exp(-mu * mu * Fo);
  }
  return Tc - sum;
  }

  static cylinderMeanTempBC3Parabolic(
  Fo: number, Bi: number, T0Ctr: number, T0Surf: number, Tc: number, N = SERIES_TERMS_DEFAULT,
  ): number {
  const mus = EigenvaluesBc3.cylinderEigenvaluesBC3(Bi, N);
  const vCtr  = Tc - T0Ctr;
  const vSurf = Tc - T0Surf;
  let sum = 0;
  for (const mu of mus) {
    const CnStar = vSurf - 2 * (vCtr - vSurf) * (1 / Bi - 2 / (mu * mu));
    const Cn = CnStar * SeriesBc3Cylinder.cylinderBn(mu, Bi);
    sum += Cn * Math.exp(-mu * mu * Fo);
  }
  return Tc - sum;
  }

  /**
   * Cylinder BC III — arbitrary initial profile f(r).
   * Cn = 2 / (R²·[J₀²(μₙ)+J₁²(μₙ)]) · ∫₀ᴿ r·f₁(r)·J₀(μₙ·r/R) dr
   * Luikov Ch. VI §6 p.242.
   */
  static cylinderTempBC3ArbitraryAbs(
  relR: number, Fo: number, Bi: number, R: number,
  f1: (r: number) => number, Tc: number,
  N = SERIES_TERMS_DEFAULT, simpsonN = SIMPSON_INTERVALS_DEFAULT,
  ): number {
  const mus = EigenvaluesBc3.cylinderEigenvaluesBC3(Bi, N);
  let sum = 0;
  for (const mu of mus) {
    const j0mu = besselJ0(mu), j1mu = besselJ1(mu);
    const norm = R * R * (j0mu * j0mu + j1mu * j1mu);
    const integral = simpson((r) => r * f1(r) * besselJ0(mu * r / R), 0, R, simpsonN);
    const Cn = 2 / norm * integral;
    sum += Cn * besselJ0(mu * relR) * Math.exp(-mu * mu * Fo);
  }
  return Tc - sum;
  }

  static cylinderMeanTempBC3ArbitraryAbs(
  Fo: number, Bi: number, R: number,
  f1: (r: number) => number, Tc: number,
  N = SERIES_TERMS_DEFAULT, simpsonN = SIMPSON_INTERVALS_DEFAULT,
  ): number {
  const mus = EigenvaluesBc3.cylinderEigenvaluesBC3(Bi, N);
  let sum = 0;
  for (const mu of mus) {
    const j0mu = besselJ0(mu), j1mu = besselJ1(mu);
    const norm = R * R * (j0mu * j0mu + j1mu * j1mu);
    const integral = simpson((r) => r * f1(r) * besselJ0(mu * r / R), 0, R, simpsonN);
    const Cn = 2 / norm * integral;
    sum += Cn * (2 * besselJ1(mu) / mu) * Math.exp(-mu * mu * Fo);
  }
  return Tc - sum;
  }

}
