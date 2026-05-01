import { Injectable } from '@nestjs/common';
import { FlowGeometry } from '../enums/flow-geometry.enum';
import { BodyGeometry } from '../enums/body-geometry.enum';
import { DimensionlessInputDto } from '../dto/dimensionless-input.dto';
import { GeometryDimsDto } from '../dto/geometry-dims.dto';
import { ResolvedDimensionlessPropsDto } from '../dto/resolved-dimensionless-props.dto';
import { CorrelationName } from '../enums/correlation-name.enum';
import { FlowRegime } from '../types/flow-regime.type';
import { NusseltResult } from '../interfaces/nusselt-result.interface';
import { ChannelGeometryHelper } from '../helpers/channel-geometry.helper';

export { NusseltResult } from '../interfaces/nusselt-result.interface';
import { BodyGeometryHelper } from '../helpers/body-geometry.helper';
import {
  availableCorrelations,
  resolveRegime, validatePreferredCorrelation,
} from '../helpers/correlation-validity.helper';
import { CorrelationSelectorHelper } from '../helpers/correlation-selector.helper';
import { Common } from '../../../common/thermal/utils/common';

@Injectable()
export class DimensionlessNumbersService {

  // ══════════════════════════════════════════════════════════════════════
  // Scalar dimensionless numbers
  // ══════════════════════════════════════════════════════════════════════

  /** Re = ρ·w·L / μ */
  reynolds(rho: number, w: number, L: number, mu: number): number {
    return (rho * w * L) / mu;
  }

  /** Re = w·L / ν */
  reynoldsKinematic(w: number, L: number, nu: number): number {
    return (w * L) / nu;
  }

  /** Pr = μ·Cp / λ */
  prandtl(mu: number, Cp_J_kgK: number, lambda: number): number {
    return (mu * Cp_J_kgK) / lambda;
  }

  /**
   * Gr = g·β·ΔT·L³ / ν²   β = 2/(T_hot+T_cold) (ideal gas)
   * g defaults to Common.g (9.80665 m/s²); override for non-Earth conditions.
   */
  grashof(T_hot_K: number, T_cold_K: number, L: number, nu: number, g = Common.g): number {
    const beta = 2 / (T_hot_K + T_cold_K);
    return g * beta * Math.abs(T_hot_K - T_cold_K) * Math.pow(L, 3) / (nu * nu);
  }

  /** Ra = Gr · Pr */
  rayleigh(T_hot_K: number, T_cold_K: number, L: number, nu: number, Pr: number, g = Common.g): number {
    return this.grashof(T_hot_K, T_cold_K, L, nu, g) * Pr;
  }

  /** h = Nu · λ / L  (heat transfer coefficient) */
  htc(Nu: number, lambda: number, L: number): number {
    return (Nu * lambda) / L;
  }

  // ══════════════════════════════════════════════════════════════════════
  // Geometry — delegate to helpers
  // ══════════════════════════════════════════════════════════════════════

  characteristicLength(geometry: FlowGeometry, dims: GeometryDimsDto): number {
    return ChannelGeometryHelper.characteristicLength(geometry, dims);
  }

  channelArea(geometry: FlowGeometry, dims: GeometryDimsDto): number {
    return ChannelGeometryHelper.area(geometry, dims);
  }

  channelPerimeter(geometry: FlowGeometry, dims: GeometryDimsDto): number {
    return ChannelGeometryHelper.perimeter(geometry, dims);
  }

  hydraulicDiameter(geometry: FlowGeometry, dims: GeometryDimsDto): number {
    return ChannelGeometryHelper.hydraulicDiameter(geometry, dims);
  }

  bodyArea(geometry: BodyGeometry, dims: GeometryDimsDto, insulationH = 0): number {
    return BodyGeometryHelper.area(geometry, dims, insulationH);
  }

  bodyVolume(geometry: BodyGeometry, dims: GeometryDimsDto): number {
    return BodyGeometryHelper.volume(geometry, dims);
  }

  meanBeamLength(geometry: BodyGeometry, dims: GeometryDimsDto): number {
    return BodyGeometryHelper.meanBeamLength(geometry, dims);
  }

  // ══════════════════════════════════════════════════════════════════════
  // Nu dispatcher — correlation selection and execution
  // ══════════════════════════════════════════════════════════════════════

  /**
  /**
   * Compute Nusselt number.
   * All dimensionless properties (Re, Pr, Ra, λ, ν) must be pre-resolved by the
   * caller via DimensionlessCalculationService.resolveDimensionlessProperties().
   */
  nusselt(
    params: DimensionlessInputDto,
    resolved: ResolvedDimensionlessPropsDto,
  ): NusseltResult {
    const { geometry, dimensions = {}, preferredCorrelation, compareAll } = params;

    const { Re, Pr, Ra } = resolved;
    const { lambda } = resolved;
    const L = ChannelGeometryHelper.characteristicLength(geometry, dimensions as GeometryDimsDto);

    const regime    = resolveRegime(geometry, Re, Ra, params.forceRegime);
    const isNatural = regime === FlowRegime.NATURAL;

    const available  = availableCorrelations(geometry);
    const allResults: Record<string, { Nu: number; rangeValid: boolean; warning?: string }> = {};
    for (const corr of available) {
      try {
        allResults[corr] = CorrelationSelectorHelper.run(corr, resolved, params, regime);
      } catch { /* skip unsupported */ }
    }

    let selectedCorr: CorrelationName;
    let preferredUsed = false;
    let preferredRejectedReason: string | undefined;

    if (preferredCorrelation) {
      const rejection = validatePreferredCorrelation(preferredCorrelation, geometry, Re, Pr, Ra);
      if (!rejection) {
        selectedCorr = preferredCorrelation;
        preferredUsed = true;
      } else {
        preferredRejectedReason = rejection;
        selectedCorr = CorrelationSelectorHelper.best(geometry, Re, regime, params);
      }
    } else {
      selectedCorr = CorrelationSelectorHelper.best(geometry, Re, regime, params);
    }

    const mainResult = allResults[selectedCorr]
      ?? CorrelationSelectorHelper.run(selectedCorr, resolved, params, regime);
    const Nu        = mainResult.Nu;
    const h_W_m2K   = lambda && L > 0 ? this.htc(Nu, lambda, L) : undefined;

    return {
      Nu, h_W_m2K,
      correlation: selectedCorr,
      regime, isNatural,
      preferredRequested: preferredCorrelation,
      preferredUsed,
      preferredRejectedReason,
      warning: mainResult.warning,
      rangeValid: mainResult.rangeValid,
      allCorrelations: compareAll ? allResults : undefined,
    };
  }
}
