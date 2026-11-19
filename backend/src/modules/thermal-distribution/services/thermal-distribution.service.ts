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
import type { AverageOptions }   from '../type/average-options.type';
import type { ThermalCriteria }  from '../type/thermal-criteria.type';
import type { ShapeInput }       from '../type/shape-input.type';
import type { RDistMode }        from '../type/r-dist-mode.type';
import { ProfileRequestDto } from '../dto/profile-request.dto';

import { CharacteristicLength } from '../utils/characteristic-length';
import type { CharacteristicLengths } from '../types/characteristic-lengths.type';
import { SeriesBc1 } from '../utils/series-bc1';
import { ThermalSeriesTemp } from '../utils/thermal-series-temp';
import { ThermalSeriesMean } from '../utils/thermal-series-mean';
import { SERIES_TERMS_DEFAULT } from '../constants/thermal-distribution.constants';

@Injectable()
export class ThermalDistributionService {

  /** Map API DTO → internal ProfileOptions. */
  toProfileOptions(dto: ProfileRequestDto): ProfileOptions {
    const avgDto = dto.avg;
    const avg: AverageOptions = {
      mode:         avgDto?.mode         ?? 'series',
      gaussNodes:   avgDto?.gaussNodes   ?? 32,
      simpsonNodes: avgDto?.simpsonNodes ?? 128,
    };
    return {
      bcType:             dto.bcType,
      Tc:                 dto.Tc,
      T0:                 dto.T0,
      tau:                dto.tau,
      alpha:              dto.alpha,
      lambda:             dto.lambda,
      thermalDiffusivity: dto.thermalDiffusivity,
      shape:              dto.shape,
      rDistMode:          dto.rDistMode,
      initialProfile:     dto.initialProfile,
      T0Ctr:              dto.T0Ctr,
      T0Surf:             dto.T0Surf,
      biPerAxis:          dto.biPerAxis,
      biCylinder:         dto.biCylinder,
      seriesTerms:        dto.seriesTerms,
      avg,
    };
  }

  /** Temperature at a single normalised depth (0 = centre, 1 = surface). */
  temperatureAtDepth(relDepth: number, opts: ProfileOptions): number {
    const { Fo, Bi, Rdist } = this.computeCriteria(opts);
    const N = opts.seriesTerms ?? SERIES_TERMS_DEFAULT;
    return ThermalSeriesTemp.tempAtDepth(relDepth, Fo, Bi, Rdist, opts, N);
  }

  /** Temperature profile along the primary spatial axis. */
  temperatureProfile(relativeDepths: number[], opts: ProfileOptions): number[] {
    const { Fo, Bi, Rdist } = this.computeCriteria(opts);
    const N = opts.seriesTerms ?? SERIES_TERMS_DEFAULT;
    return relativeDepths.map((d) =>
      ThermalSeriesTemp.tempAtDepth(d, Fo, Bi, Rdist, opts, N),
    );
  }

  /** Volume-average temperature T̄(τ). */
  averageTemperature(opts: ProfileOptions): number {
    const { Fo, Bi } = this.computeCriteria(opts);
    const N = opts.seriesTerms ?? SERIES_TERMS_DEFAULT;
    return ThermalSeriesMean.averageTemp(Fo, Bi, opts, N);
  }

  /** Compute Biot and Fourier numbers for the current configuration. */
  computeCriteria(opts: ProfileOptions): ThermalCriteria {
    const { Rdist, Rbi } = CharacteristicLength.compute(
      opts.shape,
      opts.rDistMode ?? 'true_dimension',
    );
    const Bi = opts.bcType === 'BC_I'
      ? Infinity
      : this.computeBi(opts, Rdist);
    const Fo = opts.thermalDiffusivity * opts.tau / (Rdist * Rdist);
    return { Bi, Fo, Rdist, Rbi };
  }

  /** Extract characteristic lengths from ShapeInput. */
  computeCharacteristicLengths(
    shape: ShapeInput,
    mode: RDistMode = 'true_dimension',
  ): CharacteristicLengths {
    return CharacteristicLength.compute(shape, mode);
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
    const N    = opts.seriesTerms ?? SERIES_TERMS_DEFAULT;
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
      const Tsurface = ThermalSeriesTemp.tempAtDepth(1, Fo, Bi, Rdist, stepOpts, N);
      const Tcenter  = ThermalSeriesTemp.tempAtDepth(0, Fo, Bi, Rdist, stepOpts, N);
      const Taverage = ThermalSeriesMean.averageTemp(Fo, Bi, stepOpts, N);

      results.push({ tau, Tsurface, Tcenter, Taverage });
    }

    return results;
  }

  /** Θ(x) = (T(x,τ)−Ts)/(T0−Ts) for an infinite plate (BC I). */
  plateLocalBC1Theta(relDepth: number, Fo: number, N: number): number {
    return SeriesBc1.plateLocalBC1(relDepth, Fo, N);
  }

  /** Θ(r) = (T(r,τ)−Ts)/(T0−Ts) for an infinite cylinder (BC I). */
  cylinderLocalBC1Theta(relR: number, Fo: number, N: number): number {
    return SeriesBc1.cylinderLocalBC1(relR, Fo, N);
  }

  private computeBi(opts: ProfileOptions, Rbi: number): number {
    const alpha = opts.alphaCurve
      ? opts.alphaCurve(opts.T0)
      : opts.alpha;
    if (alpha === undefined || alpha === null) {
      throw new Error('BC_III requires alpha (or alphaCurve)');
    }
    return alpha * Rbi / opts.lambda;
  }
}
