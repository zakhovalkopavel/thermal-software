/**
 * Geometry / BC dispatch for local Fourier-series temperatures.
 * Stateless — no DI. Used by ThermalDistributionService / ThermalSeriesMean.
 */
import type { ProfileOptions } from '../type/profile-options.type';
import { SeriesBc1 } from './series-bc1';
import { SeriesBc3Plate } from './series-bc3-plate';
import { SeriesBc3Cylinder } from './series-bc3-cylinder';
import { SeriesBc3Sphere } from './series-bc3-sphere';
import { SeriesHollowBc3 } from './series-hollow-bc3';

export class ThermalSeriesTemp {

  static tempAtDepth(
    relDepth: number, Fo: number, Bi: number, Rdist: number,
    opts: ProfileOptions, N: number,
  ): number {
    if (opts.bcType === 'BC_I') {
      return ThermalSeriesTemp.tempBC1(relDepth, Fo, opts.T0, opts.Tc, opts.shape.geometry, N);
    }
    return ThermalSeriesTemp.tempBC3(relDepth, Fo, Bi, Rdist, opts, N);
  }

  private static tempBC1(
    relDepth: number, Fo: number, T0: number, Tc: number, geometry: string, N: number,
  ): number {
    switch (geometry) {
      case 'plate':    return SeriesBc1.plateTempBC1(relDepth, Fo, T0, Tc, N);
      case 'cylinder': return SeriesBc1.cylinderTempBC1(relDepth, Fo, T0, Tc, N);
      case 'sphere':   return SeriesBc1.sphereTempBC1(relDepth, Fo, T0, Tc, N);
      case 'parallelepiped': {
        const Tx = (SeriesBc1.plateTempBC1(relDepth, Fo, T0, Tc, N) - Tc) / (T0 - Tc);
        return Tc + (T0 - Tc) * Tx * Tx * Tx;
      }
      case 'finite_cylinder': {
        const Tcyl   = (SeriesBc1.cylinderTempBC1(relDepth, Fo, T0, Tc, N) - Tc) / (T0 - Tc);
        const Tplate = (SeriesBc1.plateTempBC1(relDepth, Fo, T0, Tc, N) - Tc) / (T0 - Tc);
        return Tc + (T0 - Tc) * Tcyl * Tplate;
      }
      default: return SeriesBc1.sphereTempBC1(relDepth, Fo, T0, Tc, N);
    }
  }

  private static tempBC3(
    relDepth: number, Fo: number, Bi: number, Rdist: number,
    opts: ProfileOptions, N: number,
  ): number {
    const { T0, Tc, shape } = opts;
    const profile = opts.initialProfile ?? 'uniform';

    switch (shape.geometry) {
      case 'plate':    return ThermalSeriesTemp.plateTempBC3(relDepth, Fo, Bi, Rdist, T0, Tc, profile, opts, N);
      case 'cylinder': return ThermalSeriesTemp.cylinderTempBC3(relDepth, Fo, Bi, Rdist, T0, Tc, profile, opts, N);
      case 'sphere':   return ThermalSeriesTemp.sphereTempBC3(relDepth, Fo, Bi, Rdist, T0, Tc, profile, opts, N);
      case 'hollow_cylinder': return ThermalSeriesTemp.hollowTempBC3(relDepth, opts, N);
      case 'parallelepiped':  return ThermalSeriesTemp.parallelepipedTempBC3(relDepth, Fo, opts, T0, Tc, N);
      case 'finite_cylinder': return ThermalSeriesTemp.finiteCylinderTempBC3(relDepth, Fo, opts, T0, Tc, N);
      default: return ThermalSeriesTemp.cylinderTempBC3(relDepth, Fo, Bi, Rdist, T0, Tc, profile, opts, N);
    }
  }

  private static plateTempBC3(
    relDepth: number, Fo: number, Bi: number, Rdist: number,
    T0: number, Tc: number, profile: string, opts: ProfileOptions, N: number,
  ): number {
    if (profile === 'parabolic') {
      return SeriesBc3Plate.plateTempBC3Parabolic(
        relDepth, Fo, Bi, opts.T0Ctr ?? T0, opts.T0Surf ?? T0, Tc, N,
      );
    }
    if (profile === 'arbitrary' && opts.arbitraryProfileFn) {
      const f1 = (x: number) => Tc - opts.arbitraryProfileFn!(x);
      return SeriesBc3Plate.plateTempBC3ArbitraryAbs(
        relDepth, Fo, Bi, Rdist, f1, Tc, N, opts.avg?.simpsonNodes,
      );
    }
    return SeriesBc3Plate.plateTempBC3Uniform(relDepth, Fo, Bi, T0, Tc, N);
  }

  private static cylinderTempBC3(
    relR: number, Fo: number, Bi: number, Rdist: number,
    T0: number, Tc: number, profile: string, opts: ProfileOptions, N: number,
  ): number {
    if (profile === 'parabolic') {
      return SeriesBc3Cylinder.cylinderTempBC3Parabolic(
        relR, Fo, Bi, opts.T0Ctr ?? T0, opts.T0Surf ?? T0, Tc, N,
      );
    }
    if (profile === 'arbitrary' && opts.arbitraryProfileFn) {
      const f1 = (r: number) => Tc - opts.arbitraryProfileFn!(r);
      return SeriesBc3Cylinder.cylinderTempBC3ArbitraryAbs(
        relR, Fo, Bi, Rdist, f1, Tc, N, opts.avg?.simpsonNodes,
      );
    }
    return SeriesBc3Cylinder.cylinderTempBC3Uniform(relR, Fo, Bi, T0, Tc, N);
  }

  private static sphereTempBC3(
    relR: number, Fo: number, Bi: number, Rdist: number,
    T0: number, Tc: number, profile: string, opts: ProfileOptions, N: number,
  ): number {
    if (profile === 'parabolic') {
      return SeriesBc3Sphere.sphereTempBC3Parabolic(
        relR, Fo, Bi, opts.T0Ctr ?? T0, opts.T0Surf ?? T0, Tc, N,
      );
    }
    if (profile === 'arbitrary' && opts.arbitraryProfileFn) {
      const f1 = (r: number) => Tc - opts.arbitraryProfileFn!(r);
      return SeriesBc3Sphere.sphereTempBC3ArbitraryAbs(
        relR, Fo, Bi, Rdist, f1, Tc, N, opts.avg?.simpsonNodes,
      );
    }
    return SeriesBc3Sphere.sphereTempBC3Uniform(relR, Fo, Bi, T0, Tc, N);
  }

  private static hollowTempBC3(relDepth: number, opts: ProfileOptions, N: number): number {
    const { innerRadius: R1, outerRadius: R2 } = opts.shape;
    if (R1 === undefined || R2 === undefined) {
      throw new Error('hollow_cylinder requires shape.innerRadius and shape.outerRadius');
    }
    const alpha = opts.alpha ?? 0;
    const r = R1 + relDepth * (R2 - R1);
    const f1 = opts.arbitraryProfileFn
      ? (rr: number) => opts.Tc - opts.arbitraryProfileFn!(rr)
      : (_rr: number) => opts.Tc - opts.T0;
    return SeriesHollowBc3.hollowCylinderTempBC3(
      r, opts.tau, R1, R2, alpha, alpha, opts.lambda, opts.thermalDiffusivity,
      f1, opts.Tc, N, opts.avg?.simpsonNodes,
    );
  }

  private static parallelepipedTempBC3(
    relDepth: number, Fo: number, opts: ProfileOptions, T0: number, Tc: number, N: number,
  ): number {
    const [Bi1, Bi2, Bi3] = opts.biPerAxis ?? [1, 1, 1];
    const ThetaX = (SeriesBc3Plate.plateTempBC3Uniform(relDepth, Fo, Bi1, T0, Tc, N) - Tc) / (T0 - Tc);
    const ThetaY = (SeriesBc3Plate.plateTempBC3Uniform(relDepth, Fo, Bi2, T0, Tc, N) - Tc) / (T0 - Tc);
    const ThetaZ = (SeriesBc3Plate.plateTempBC3Uniform(relDepth, Fo, Bi3, T0, Tc, N) - Tc) / (T0 - Tc);
    return Tc + (T0 - Tc) * ThetaX * ThetaY * ThetaZ;
  }

  private static finiteCylinderTempBC3(
    relDepth: number, Fo: number, opts: ProfileOptions, T0: number, Tc: number, N: number,
  ): number {
    const [BiLat, BiEnd] = opts.biCylinder ?? [1, 1];
    const ThetaCyl   = (SeriesBc3Cylinder.cylinderTempBC3Uniform(relDepth, Fo, BiLat, T0, Tc, N) - Tc) / (T0 - Tc);
    const ThetaPlate = (SeriesBc3Plate.plateTempBC3Uniform(relDepth, Fo, BiEnd, T0, Tc, N) - Tc) / (T0 - Tc);
    return Tc + (T0 - Tc) * ThetaCyl * ThetaPlate;
  }
}
