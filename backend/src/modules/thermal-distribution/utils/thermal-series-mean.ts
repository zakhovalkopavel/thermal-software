/**
 * Geometry / BC dispatch for volume-average Fourier-series temperatures.
 * Stateless — no DI. Used by ThermalDistributionService.
 */
import type { ProfileOptions } from '../type/profile-options.type';
import type { GaussNodeCount } from '../../../common/utils/quadrature';
import { adaptiveIntegrate } from '../../../common/utils/quadrature';
import { CharacteristicLength } from './characteristic-length';
import { SeriesBc1 } from './series-bc1';
import { SeriesBc3Plate } from './series-bc3-plate';
import { SeriesBc3Cylinder } from './series-bc3-cylinder';
import { SeriesBc3Sphere } from './series-bc3-sphere';
import { SeriesHollowBc3 } from './series-hollow-bc3';
import { ThermalSeriesTemp } from './thermal-series-temp';
import {
  AVERAGE_MODE_DEFAULT,
  GAUSS_NODES_DEFAULT,
} from '../constants/thermal-distribution.constants';

export class ThermalSeriesMean {

  static averageTemp(Fo: number, Bi: number, opts: ProfileOptions, N: number): number {
    const { T0, Tc, shape } = opts;
    const avgMode = opts.avg?.mode ?? AVERAGE_MODE_DEFAULT;
    const gaussN  = (opts.avg?.gaussNodes ?? GAUSS_NODES_DEFAULT) as GaussNodeCount;
    const { Rdist } = CharacteristicLength.compute(
      shape, opts.rDistMode ?? 'true_dimension',
    );

    if (shape.geometry === 'hollow_cylinder') {
      const { innerRadius: R1, outerRadius: R2 } = shape;
      if (R1 === undefined || R2 === undefined) {
        throw new Error('hollow_cylinder requires shape.innerRadius and shape.outerRadius');
      }
      const alpha = opts.alpha ?? 0;
      const f1 = opts.arbitraryProfileFn
        ? (r: number) => Tc - opts.arbitraryProfileFn!(r)
        : (_r: number) => Tc - T0;
      return SeriesHollowBc3.hollowCylinderMeanTempBC3(
        opts.tau, R1, R2, alpha, alpha, opts.lambda, opts.thermalDiffusivity,
        f1, Tc, N, opts.avg?.simpsonNodes, gaussN as number,
      );
    }

    if (avgMode === 'gauss') {
      return ThermalSeriesMean.averageTempGauss(Fo, Bi, Rdist, opts, N, gaussN);
    }

    if (opts.bcType === 'BC_I') {
      return ThermalSeriesMean.averageTempBC1Series(Fo, T0, Tc, shape.geometry, N);
    }
    const profile = opts.initialProfile ?? 'uniform';
    return ThermalSeriesMean.averageTempBC3Series(
      Fo, Bi, Rdist, T0, Tc, profile, shape.geometry, opts, N,
    );
  }

  private static averageTempBC1Series(
    Fo: number, T0: number, Tc: number, geometry: string, N: number,
  ): number {
    switch (geometry) {
      case 'plate':    return SeriesBc1.plateMeanTempBC1(Fo, T0, Tc, N);
      case 'cylinder': return SeriesBc1.cylinderMeanTempBC1(Fo, T0, Tc, N);
      case 'sphere':   return SeriesBc1.sphereMeanTempBC1(Fo, T0, Tc, N);
      case 'parallelepiped': {
        const MeanX = (SeriesBc1.plateMeanTempBC1(Fo, T0, Tc, N) - Tc) / (T0 - Tc);
        return Tc + (T0 - Tc) * MeanX * MeanX * MeanX;
      }
      case 'finite_cylinder': {
        const MCyl   = (SeriesBc1.cylinderMeanTempBC1(Fo, T0, Tc, N) - Tc) / (T0 - Tc);
        const MPlate = (SeriesBc1.plateMeanTempBC1(Fo, T0, Tc, N) - Tc) / (T0 - Tc);
        return Tc + (T0 - Tc) * MCyl * MPlate;
      }
      default: return SeriesBc1.sphereMeanTempBC1(Fo, T0, Tc, N);
    }
  }

  private static averageTempBC3Series(
    Fo: number, Bi: number, Rdist: number,
    T0: number, Tc: number, profile: string,
    geometry: string, opts: ProfileOptions, N: number,
  ): number {
    switch (geometry) {
      case 'plate':    return ThermalSeriesMean.plateMeanBC3(Fo, Bi, Rdist, T0, Tc, profile, opts, N);
      case 'cylinder': return ThermalSeriesMean.cylinderMeanBC3(Fo, Bi, Rdist, T0, Tc, profile, opts, N);
      case 'sphere':   return ThermalSeriesMean.sphereMeanBC3(Fo, Bi, Rdist, T0, Tc, profile, opts, N);
      case 'parallelepiped': {
        const [Bi1, Bi2, Bi3] = opts.biPerAxis ?? [Bi, Bi, Bi];
        const M1 = (SeriesBc3Plate.plateMeanTempBC3Uniform(Fo, Bi1, T0, Tc, N) - Tc) / (T0 - Tc);
        const M2 = (SeriesBc3Plate.plateMeanTempBC3Uniform(Fo, Bi2, T0, Tc, N) - Tc) / (T0 - Tc);
        const M3 = (SeriesBc3Plate.plateMeanTempBC3Uniform(Fo, Bi3, T0, Tc, N) - Tc) / (T0 - Tc);
        return Tc + (T0 - Tc) * M1 * M2 * M3;
      }
      case 'finite_cylinder': {
        const [BiLat, BiEnd] = opts.biCylinder ?? [Bi, Bi];
        const MCyl   = (SeriesBc3Cylinder.cylinderMeanTempBC3Uniform(Fo, BiLat, T0, Tc, N) - Tc) / (T0 - Tc);
        const MPlate = (SeriesBc3Plate.plateMeanTempBC3Uniform(Fo, BiEnd, T0, Tc, N) - Tc) / (T0 - Tc);
        return Tc + (T0 - Tc) * MCyl * MPlate;
      }
      default: return ThermalSeriesMean.cylinderMeanBC3(Fo, Bi, Rdist, T0, Tc, profile, opts, N);
    }
  }

  private static plateMeanBC3(
    Fo: number, Bi: number, Rdist: number,
    T0: number, Tc: number, profile: string, opts: ProfileOptions, N: number,
  ): number {
    if (profile === 'parabolic') {
      return SeriesBc3Plate.plateMeanTempBC3Parabolic(
        Fo, Bi, opts.T0Ctr ?? T0, opts.T0Surf ?? T0, Tc, N,
      );
    }
    if (profile === 'arbitrary' && opts.arbitraryProfileFn) {
      const f1 = (x: number) => Tc - opts.arbitraryProfileFn!(x);
      return SeriesBc3Plate.plateMeanTempBC3ArbitraryAbs(
        Fo, Bi, Rdist, f1, Tc, N, opts.avg?.simpsonNodes,
      );
    }
    return SeriesBc3Plate.plateMeanTempBC3Uniform(Fo, Bi, T0, Tc, N);
  }

  private static cylinderMeanBC3(
    Fo: number, Bi: number, Rdist: number,
    T0: number, Tc: number, profile: string, opts: ProfileOptions, N: number,
  ): number {
    if (profile === 'parabolic') {
      return SeriesBc3Cylinder.cylinderMeanTempBC3Parabolic(
        Fo, Bi, opts.T0Ctr ?? T0, opts.T0Surf ?? T0, Tc, N,
      );
    }
    if (profile === 'arbitrary' && opts.arbitraryProfileFn) {
      const f1 = (r: number) => Tc - opts.arbitraryProfileFn!(r);
      return SeriesBc3Cylinder.cylinderMeanTempBC3ArbitraryAbs(
        Fo, Bi, Rdist, f1, Tc, N, opts.avg?.simpsonNodes,
      );
    }
    return SeriesBc3Cylinder.cylinderMeanTempBC3Uniform(Fo, Bi, T0, Tc, N);
  }

  private static sphereMeanBC3(
    Fo: number, Bi: number, Rdist: number,
    T0: number, Tc: number, profile: string, opts: ProfileOptions, N: number,
  ): number {
    if (profile === 'parabolic') {
      return SeriesBc3Sphere.sphereMeanTempBC3Parabolic(
        Fo, Bi, opts.T0Ctr ?? T0, opts.T0Surf ?? T0, Tc, N,
      );
    }
    if (profile === 'arbitrary' && opts.arbitraryProfileFn) {
      const f1 = (r: number) => Tc - opts.arbitraryProfileFn!(r);
      return SeriesBc3Sphere.sphereMeanTempBC3ArbitraryAbs(
        Fo, Bi, Rdist, f1, Tc, N, opts.avg?.simpsonNodes,
      );
    }
    return SeriesBc3Sphere.sphereMeanTempBC3Uniform(Fo, Bi, T0, Tc, N);
  }

  private static averageTempGauss(
    Fo: number, Bi: number, Rdist: number,
    opts: ProfileOptions, N: number, gaussN: GaussNodeCount,
  ): number {
    const tempFn = (relDepth: number) =>
      ThermalSeriesTemp.tempAtDepth(relDepth, Fo, Bi, Rdist, opts, N);
    const nodes = gaussN as number;
    switch (opts.shape.geometry) {
      case 'plate':    return adaptiveIntegrate(tempFn, 0, 1, { method: 'auto', nodes });
      case 'cylinder': return adaptiveIntegrate((u) => tempFn(u) * u, 0, 1, { method: 'auto', nodes }) * 2;
      case 'sphere':   return adaptiveIntegrate((u) => tempFn(u) * u * u, 0, 1, { method: 'auto', nodes }) * 3;
      default:         return adaptiveIntegrate(tempFn, 0, 1, { method: 'auto', nodes });
    }
  }
}
