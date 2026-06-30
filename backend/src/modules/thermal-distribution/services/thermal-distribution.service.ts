/**
 * ThermalDistributionService
 *
 * Orchestrates transient temperature distribution calculations for solid bodies
 * under convective (BC III) or prescribed-surface (BC I) boundary conditions.
 *
 * Exact Fourier series solutions per Luikov A.V. — Analytical Heat Diffusion Theory,
 * Academic Press, 1968.
 *
 * Public API mirrors THERMAL_DISTRIBUTION_SPEC_06_API.md §4.
 */
import { Injectable } from '@nestjs/common';
import type { ProfileOptions }   from '../type/profile-options.type';
import type { ThermalCriteria }  from '../type/thermal-criteria.type';
import type { GaussNodes }       from '../type/gauss-nodes.type';
import type { ShapeInput }       from '../type/shape-input.type';
import type { RDistMode }        from '../type/r-dist-mode.type';

import {
  computeCharacteristicLengths,
  type CharacteristicLengths,
} from '../utils/characteristic-length.util';

// ── BC I solvers ──────────────────────────────────────────────────────────────
import {
  plateLocalBC1,
  plateTempBC1,
  plateMeanTempBC1,
  cylinderLocalBC1,
  cylinderTempBC1,
  cylinderMeanTempBC1,
  sphereTempBC1,
  sphereMeanTempBC1,
} from '../utils/series-bc1.util';

// ── BC III — plate ────────────────────────────────────────────────────────────
import {
  plateTempBC3Uniform,
  plateMeanTempBC3Uniform,
  plateTempBC3Parabolic,
  plateMeanTempBC3Parabolic,
  plateTempBC3ArbitraryAbs,
  plateMeanTempBC3ArbitraryAbs,
} from '../utils/series-bc3.util';

// ── BC III — cylinder ─────────────────────────────────────────────────────────
import {
  cylinderTempBC3Uniform,
  cylinderMeanTempBC3Uniform,
  cylinderTempBC3Parabolic,
  cylinderMeanTempBC3Parabolic,
  cylinderTempBC3ArbitraryAbs,
  cylinderMeanTempBC3ArbitraryAbs,
} from '../utils/series-bc3.util';

// ── BC III — sphere ───────────────────────────────────────────────────────────
import {
  sphereTempBC3Uniform,
  sphereMeanTempBC3Uniform,
  sphereTempBC3Parabolic,
  sphereMeanTempBC3Parabolic,
  sphereTempBC3ArbitraryAbs,
  sphereMeanTempBC3ArbitraryAbs,
} from '../utils/series-bc3.util';

// ── BC III — hollow cylinder ──────────────────────────────────────────────────
import {
  hollowCylinderTempBC3,
  hollowCylinderMeanTempBC3,
} from '../utils/series-hollow-bc3.util';

// ── Adaptive quadrature (auto-selects Gauss-Legendre vs Clenshaw-Curtis) ──────
import { adaptiveIntegrate } from '../../../common/utils/quadrature.util';
import type { GaussNodeCount } from '../../../common/utils/gauss-legendre.constants';

const DEFAULT_SERIES_TERMS = 100;
const DEFAULT_GAUSS_NODES: GaussNodeCount = 32;
const DEFAULT_AVG_MODE = 'series' as const;

@Injectable()
export class ThermalDistributionService {

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Temperature at a single normalised depth (0 = centre, 1 = surface). */
  temperatureAtDepth(relDepth: number, opts: ProfileOptions): number {
    const { Fo, Bi, Rdist } = this.computeCriteria(opts);
    const N = opts.seriesTerms ?? DEFAULT_SERIES_TERMS;
    return this._tempAtDepth(relDepth, Fo, Bi, Rdist, opts, N);
  }

  /** Temperature profile along the primary spatial axis. */
  temperatureProfile(relativeDepths: number[], opts: ProfileOptions): number[] {
    const { Fo, Bi, Rdist } = this.computeCriteria(opts);
    const N = opts.seriesTerms ?? DEFAULT_SERIES_TERMS;
    return relativeDepths.map((d) => this._tempAtDepth(d, Fo, Bi, Rdist, opts, N));
  }

  /** Volume-average temperature T̄(τ). */
  averageTemperature(opts: ProfileOptions): number {
    const { Fo, Bi } = this.computeCriteria(opts);
    const N = opts.seriesTerms ?? DEFAULT_SERIES_TERMS;
    return this._averageTemp(Fo, Bi, opts, N);
  }

  /** Compute Biot and Fourier numbers for the current configuration. */
  computeCriteria(opts: ProfileOptions): ThermalCriteria {
    const { Rdist, Rbi } = computeCharacteristicLengths(
      opts.shape,
      opts.rDistMode ?? 'true_dimension',
    );
    const Bi = opts.bcType === 'BC_I'
      ? Infinity
      : this._computeBi(opts, Rdist);
    const Fo = opts.thermalDiffusivity * opts.tau / (Rdist * Rdist);
    return { Bi, Fo, Rdist, Rbi };
  }

  /** Extract characteristic lengths from ShapeInput. */
  computeCharacteristicLengths(
    shape: ShapeInput,
    mode: RDistMode = 'true_dimension',
  ): CharacteristicLengths {
    return computeCharacteristicLengths(shape, mode);
  }

  /**
   * Non-linear sequential interval loop (oil quenching).
   * Returns time series of {tau, Tsurface, Tcenter, Taverage}.
   */
  runTimeSteppingLoop(
    opts: ProfileOptions,
  ): Array<{ tau: number; Tsurface: number; Tcenter: number; Taverage: number }> {
    if (!opts.alphaCurve && opts.alpha === undefined) {
      throw new Error('runTimeSteppingLoop: alphaCurve or alpha required');
    }
    const dt   = opts.timeStep ?? 1;
    const tEnd = opts.tau;
    const N    = opts.seriesTerms ?? DEFAULT_SERIES_TERMS;
    const results: Array<{ tau: number; Tsurface: number; Tcenter: number; Taverage: number }> = [];

    let stepOpts: ProfileOptions = { ...opts };

    for (let elapsed = dt; elapsed <= tEnd + dt / 2; elapsed += dt) {
      const tau = Math.min(elapsed, tEnd);
      stepOpts = { ...stepOpts, tau };

      if (opts.alphaCurve) {
        const Ts = this.temperatureAtDepth(1, stepOpts);
        stepOpts = { ...stepOpts, alpha: opts.alphaCurve(Ts) };
      }

      const { Fo, Bi, Rdist } = this.computeCriteria(stepOpts);
      const Tsurface = this._tempAtDepth(1, Fo, Bi, Rdist, stepOpts, N);
      const Tcenter  = this._tempAtDepth(0, Fo, Bi, Rdist, stepOpts, N);
      const Taverage = this._averageTemp(Fo, Bi, stepOpts, N);

      results.push({ tau, Tsurface, Tcenter, Taverage });
    }

    return results;
  }

  // ── Private: temperature at depth ──────────────────────────────────────────

  private _computeBi(opts: ProfileOptions, Rbi: number): number {
    const alpha = opts.alphaCurve
      ? opts.alphaCurve(opts.T0)
      : opts.alpha;
    if (alpha === undefined || alpha === null) {
      throw new Error('BC_III requires alpha (or alphaCurve)');
    }
    return alpha * Rbi / opts.lambda;
  }

  private _tempAtDepth(
    relDepth: number, Fo: number, Bi: number, Rdist: number,
    opts: ProfileOptions, N: number,
  ): number {
    if (opts.bcType === 'BC_I') {
      return this._tempBC1(relDepth, Fo, opts.T0, opts.Tc, opts.shape.geometry, N);
    }
    return this._tempBC3(relDepth, Fo, Bi, Rdist, opts, N);
  }

  private _tempBC1(
    relDepth: number, Fo: number, T0: number, Tc: number, geometry: string, N: number,
  ): number {
    switch (geometry) {
      case 'plate':    return plateTempBC1(relDepth, Fo, T0, Tc, N);
      case 'cylinder': return cylinderTempBC1(relDepth, Fo, T0, Tc, N);
      case 'sphere':   return sphereTempBC1(relDepth, Fo, T0, Tc, N);
      case 'parallelepiped': {
        const Tx = (plateTempBC1(relDepth, Fo, T0, Tc, N) - Tc) / (T0 - Tc);
        return Tc + (T0 - Tc) * Tx * Tx * Tx;
      }
      case 'finite_cylinder': {
        const Tcyl   = (cylinderTempBC1(relDepth, Fo, T0, Tc, N) - Tc) / (T0 - Tc);
        const Tplate = (plateTempBC1(relDepth, Fo, T0, Tc, N) - Tc) / (T0 - Tc);
        return Tc + (T0 - Tc) * Tcyl * Tplate;
      }
      default: return sphereTempBC1(relDepth, Fo, T0, Tc, N);
    }
  }

  private _tempBC3(
    relDepth: number, Fo: number, Bi: number, Rdist: number,
    opts: ProfileOptions, N: number,
  ): number {
    const { T0, Tc, shape } = opts;
    const profile = opts.initialProfile ?? 'uniform';

    switch (shape.geometry) {
      case 'plate':    return this._plateTempBC3(relDepth, Fo, Bi, Rdist, T0, Tc, profile, opts, N);
      case 'cylinder': return this._cylinderTempBC3(relDepth, Fo, Bi, Rdist, T0, Tc, profile, opts, N);
      case 'sphere':   return this._sphereTempBC3(relDepth, Fo, Bi, Rdist, T0, Tc, profile, opts, N);
      case 'hollow_cylinder': return this._hollowTempBC3(relDepth, Fo, opts, N);
      case 'parallelepiped':  return this._parallelepipedTempBC3(relDepth, Fo, opts, T0, Tc, N);
      case 'finite_cylinder': return this._finiteCylinderTempBC3(relDepth, Fo, opts, T0, Tc, N);
      default: return this._cylinderTempBC3(relDepth, Fo, Bi, Rdist, T0, Tc, profile, opts, N);
    }
  }

  // ── Plate BC III ────────────────────────────────────────────────────────────
  private _plateTempBC3(
    relDepth: number, Fo: number, Bi: number, Rdist: number,
    T0: number, Tc: number, profile: string, opts: ProfileOptions, N: number,
  ): number {
    if (profile === 'parabolic') {
      return plateTempBC3Parabolic(relDepth, Fo, Bi, opts.T0Ctr ?? T0, opts.T0Surf ?? T0, Tc, N);
    }
    if (profile === 'arbitrary' && opts.arbitraryProfileFn) {
      const f1 = (x: number) => Tc - opts.arbitraryProfileFn!(x);
      return plateTempBC3ArbitraryAbs(
        relDepth, Fo, Bi, Rdist, f1, Tc, N, opts.avg?.simpsonNodes,
      );
    }
    return plateTempBC3Uniform(relDepth, Fo, Bi, T0, Tc, N);
  }

  // ── Cylinder BC III ─────────────────────────────────────────────────────────
  private _cylinderTempBC3(
    relR: number, Fo: number, Bi: number, Rdist: number,
    T0: number, Tc: number, profile: string, opts: ProfileOptions, N: number,
  ): number {
    if (profile === 'parabolic') {
      return cylinderTempBC3Parabolic(relR, Fo, Bi, opts.T0Ctr ?? T0, opts.T0Surf ?? T0, Tc, N);
    }
    if (profile === 'arbitrary' && opts.arbitraryProfileFn) {
      const f1 = (r: number) => Tc - opts.arbitraryProfileFn!(r);
      return cylinderTempBC3ArbitraryAbs(
        relR, Fo, Bi, Rdist, f1, Tc, N, opts.avg?.simpsonNodes,
      );
    }
    return cylinderTempBC3Uniform(relR, Fo, Bi, T0, Tc, N);
  }

  // ── Sphere BC III ───────────────────────────────────────────────────────────
  private _sphereTempBC3(
    relR: number, Fo: number, Bi: number, Rdist: number,
    T0: number, Tc: number, profile: string, opts: ProfileOptions, N: number,
  ): number {
    if (profile === 'parabolic') {
      return sphereTempBC3Parabolic(relR, Fo, Bi, opts.T0Ctr ?? T0, opts.T0Surf ?? T0, Tc, N);
    }
    if (profile === 'arbitrary' && opts.arbitraryProfileFn) {
      const f1 = (r: number) => Tc - opts.arbitraryProfileFn!(r);
      return sphereTempBC3ArbitraryAbs(
        relR, Fo, Bi, Rdist, f1, Tc, N, opts.avg?.simpsonNodes,
      );
    }
    return sphereTempBC3Uniform(relR, Fo, Bi, T0, Tc, N);
  }

  // ── Hollow cylinder BC III ──────────────────────────────────────────────────
  private _hollowTempBC3(relDepth: number, _Fo: number, opts: ProfileOptions, N: number): number {
    const { innerRadius: R1, outerRadius: R2 } = opts.shape;
    if (R1 === undefined || R2 === undefined) {
      throw new Error('hollow_cylinder requires shape.innerRadius and shape.outerRadius');
    }
    const alpha = opts.alpha ?? 0;
    const r = R1 + relDepth * (R2 - R1);
    const f1 = opts.arbitraryProfileFn
      ? (rr: number) => opts.Tc - opts.arbitraryProfileFn!(rr)
      : (_rr: number) => opts.Tc - opts.T0;
    return hollowCylinderTempBC3(
      r, opts.tau, R1, R2, alpha, alpha, opts.lambda, opts.thermalDiffusivity,
      f1, opts.Tc, N, opts.avg?.simpsonNodes,
    );
  }

  // ── Product rule — parallelepiped BC III ───────────────────────────────────
  private _parallelepipedTempBC3(
    relDepth: number, Fo: number, opts: ProfileOptions, T0: number, Tc: number, N: number,
  ): number {
    const [Bi1, Bi2, Bi3] = opts.biPerAxis ?? [1, 1, 1];
    const ThetaX = (plateTempBC3Uniform(relDepth, Fo, Bi1, T0, Tc, N) - Tc) / (T0 - Tc);
    const ThetaY = (plateTempBC3Uniform(relDepth, Fo, Bi2, T0, Tc, N) - Tc) / (T0 - Tc);
    const ThetaZ = (plateTempBC3Uniform(relDepth, Fo, Bi3, T0, Tc, N) - Tc) / (T0 - Tc);
    return Tc + (T0 - Tc) * ThetaX * ThetaY * ThetaZ;
  }

  // ── Product rule — finite cylinder BC III ──────────────────────────────────
  private _finiteCylinderTempBC3(
    relDepth: number, Fo: number, opts: ProfileOptions, T0: number, Tc: number, N: number,
  ): number {
    const [BiLat, BiEnd] = opts.biCylinder ?? [1, 1];
    const ThetaCyl   = (cylinderTempBC3Uniform(relDepth, Fo, BiLat, T0, Tc, N) - Tc) / (T0 - Tc);
    const ThetaPlate = (plateTempBC3Uniform(relDepth, Fo, BiEnd, T0, Tc, N) - Tc) / (T0 - Tc);
    return Tc + (T0 - Tc) * ThetaCyl * ThetaPlate;
  }

  // ── Volume average ──────────────────────────────────────────────────────────

  private _averageTemp(Fo: number, Bi: number, opts: ProfileOptions, N: number): number {
    const { T0, Tc, shape } = opts;
    const avgMode = opts.avg?.mode ?? DEFAULT_AVG_MODE;
    const gaussN  = (opts.avg?.gaussNodes ?? DEFAULT_GAUSS_NODES) as GaussNodeCount;
    const { Rdist } = this.computeCharacteristicLengths(
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
      return hollowCylinderMeanTempBC3(
        opts.tau, R1, R2, alpha, alpha, opts.lambda, opts.thermalDiffusivity,
        f1, Tc, N, opts.avg?.simpsonNodes, gaussN as number,
      );
    }

    if (avgMode === 'gauss') {
      return this._averageTempGauss(Fo, Bi, Rdist, opts, N, gaussN);
    }

    if (opts.bcType === 'BC_I') {
      return this._averageTempBC1Series(Fo, T0, Tc, shape.geometry, N);
    }
    const profile = opts.initialProfile ?? 'uniform';
    return this._averageTempBC3Series(Fo, Bi, Rdist, T0, Tc, profile, shape.geometry, opts, N);
  }

  private _averageTempBC1Series(
    Fo: number, T0: number, Tc: number, geometry: string, N: number,
  ): number {
    switch (geometry) {
      case 'plate':    return plateMeanTempBC1(Fo, T0, Tc, N);
      case 'cylinder': return cylinderMeanTempBC1(Fo, T0, Tc, N);
      case 'sphere':   return sphereMeanTempBC1(Fo, T0, Tc, N);
      case 'parallelepiped': {
        const MeanX = (plateMeanTempBC1(Fo, T0, Tc, N) - Tc) / (T0 - Tc);
        return Tc + (T0 - Tc) * MeanX * MeanX * MeanX;
      }
      case 'finite_cylinder': {
        const MCyl   = (cylinderMeanTempBC1(Fo, T0, Tc, N) - Tc) / (T0 - Tc);
        const MPlate = (plateMeanTempBC1(Fo, T0, Tc, N) - Tc) / (T0 - Tc);
        return Tc + (T0 - Tc) * MCyl * MPlate;
      }
      default: return sphereMeanTempBC1(Fo, T0, Tc, N);
    }
  }

  private _averageTempBC3Series(
    Fo: number, Bi: number, Rdist: number,
    T0: number, Tc: number, profile: string,
    geometry: string, opts: ProfileOptions, N: number,
  ): number {
    switch (geometry) {
      case 'plate':    return this._plateMeanBC3(Fo, Bi, Rdist, T0, Tc, profile, opts, N);
      case 'cylinder': return this._cylinderMeanBC3(Fo, Bi, Rdist, T0, Tc, profile, opts, N);
      case 'sphere':   return this._sphereMeanBC3(Fo, Bi, Rdist, T0, Tc, profile, opts, N);
      case 'parallelepiped': {
        const [Bi1, Bi2, Bi3] = opts.biPerAxis ?? [Bi, Bi, Bi];
        const M1 = (plateMeanTempBC3Uniform(Fo, Bi1, T0, Tc, N) - Tc) / (T0 - Tc);
        const M2 = (plateMeanTempBC3Uniform(Fo, Bi2, T0, Tc, N) - Tc) / (T0 - Tc);
        const M3 = (plateMeanTempBC3Uniform(Fo, Bi3, T0, Tc, N) - Tc) / (T0 - Tc);
        return Tc + (T0 - Tc) * M1 * M2 * M3;
      }
      case 'finite_cylinder': {
        const [BiLat, BiEnd] = opts.biCylinder ?? [Bi, Bi];
        const MCyl   = (cylinderMeanTempBC3Uniform(Fo, BiLat, T0, Tc, N) - Tc) / (T0 - Tc);
        const MPlate = (plateMeanTempBC3Uniform(Fo, BiEnd, T0, Tc, N) - Tc) / (T0 - Tc);
        return Tc + (T0 - Tc) * MCyl * MPlate;
      }
      default: return this._cylinderMeanBC3(Fo, Bi, Rdist, T0, Tc, profile, opts, N);
    }
  }

  private _plateMeanBC3(
    Fo: number, Bi: number, Rdist: number,
    T0: number, Tc: number, profile: string, opts: ProfileOptions, N: number,
  ): number {
    if (profile === 'parabolic')
      return plateMeanTempBC3Parabolic(Fo, Bi, opts.T0Ctr ?? T0, opts.T0Surf ?? T0, Tc, N);
    if (profile === 'arbitrary' && opts.arbitraryProfileFn) {
      const f1 = (x: number) => Tc - opts.arbitraryProfileFn!(x);
      return plateMeanTempBC3ArbitraryAbs(Fo, Bi, Rdist, f1, Tc, N, opts.avg?.simpsonNodes);
    }
    return plateMeanTempBC3Uniform(Fo, Bi, T0, Tc, N);
  }

  private _cylinderMeanBC3(
    Fo: number, Bi: number, Rdist: number,
    T0: number, Tc: number, profile: string, opts: ProfileOptions, N: number,
  ): number {
    if (profile === 'parabolic')
      return cylinderMeanTempBC3Parabolic(Fo, Bi, opts.T0Ctr ?? T0, opts.T0Surf ?? T0, Tc, N);
    if (profile === 'arbitrary' && opts.arbitraryProfileFn) {
      const f1 = (r: number) => Tc - opts.arbitraryProfileFn!(r);
      return cylinderMeanTempBC3ArbitraryAbs(Fo, Bi, Rdist, f1, Tc, N, opts.avg?.simpsonNodes);
    }
    return cylinderMeanTempBC3Uniform(Fo, Bi, T0, Tc, N);
  }

  private _sphereMeanBC3(
    Fo: number, Bi: number, Rdist: number,
    T0: number, Tc: number, profile: string, opts: ProfileOptions, N: number,
  ): number {
    if (profile === 'parabolic')
      return sphereMeanTempBC3Parabolic(Fo, Bi, opts.T0Ctr ?? T0, opts.T0Surf ?? T0, Tc, N);
    if (profile === 'arbitrary' && opts.arbitraryProfileFn) {
      const f1 = (r: number) => Tc - opts.arbitraryProfileFn!(r);
      return sphereMeanTempBC3ArbitraryAbs(Fo, Bi, Rdist, f1, Tc, N, opts.avg?.simpsonNodes);
    }
    return sphereMeanTempBC3Uniform(Fo, Bi, T0, Tc, N);
  }

  // ── Gauss-Legendre average (explicit gauss mode) ────────────────────────────
  private _averageTempGauss(
    Fo: number, Bi: number, Rdist: number,
    opts: ProfileOptions, N: number, gaussN: GaussNodeCount,
  ): number {
    const tempFn = (relDepth: number) =>
      this._tempAtDepth(relDepth, Fo, Bi, Rdist, opts, N);

    // Temperature profiles containing cos(μₙ·x/R) or J₀(μₙ·r/R) may oscillate
    // at large Fo or high series index — use auto-detection.
    const nodes = gaussN as number;
    switch (opts.shape.geometry) {
      case 'plate':    return adaptiveIntegrate(tempFn, 0, 1, { method: 'auto', nodes });
      case 'cylinder': return adaptiveIntegrate((u) => tempFn(u) * u, 0, 1, { method: 'auto', nodes }) * 2;
      case 'sphere':   return adaptiveIntegrate((u) => tempFn(u) * u * u, 0, 1, { method: 'auto', nodes }) * 3;
      default:         return adaptiveIntegrate(tempFn, 0, 1, { method: 'auto', nodes });
    }
  }

  // ── Internal dimensionless spatial functions used by product rule ───────────

  /** Θ(x) = (T(x,τ)−Ts)/(T0−Ts) for an infinite plate (BC I). */
  plateLocalBC1Theta(relDepth: number, Fo: number, N: number): number {
    return plateLocalBC1(relDepth, Fo, N);
  }

  /** Θ(r) = (T(r,τ)−Ts)/(T0−Ts) for an infinite cylinder (BC I). */
  cylinderLocalBC1Theta(relR: number, Fo: number, N: number): number {
    return cylinderLocalBC1(relR, Fo, N);
  }
}
