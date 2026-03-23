import { Injectable } from '@nestjs/common';
import { FlowGeometry } from '../enums/flow-geometry.enum';
import { BodyGeometry } from '../enums/body-geometry.enum';
import {
  DimensionlessInputDto, CorrelationName, GeometryDimsDto,
} from '../dto/dimensionless.dto';
import { FlowRegime } from '../types/flow-regime.type';
import { ChannelGeometryHelper } from '../helpers/channel-geometry.helper';
import { BodyGeometryHelper } from '../helpers/body-geometry.helper';
import {
  CORRELATION_VALIDITY, availableCorrelations,
  resolveRegime, validatePreferredCorrelation,
} from '../helpers/correlation-validity.helper';
import { runCorrelation, bestCorrelation } from '../helpers/correlation-selector.helper';
import { Common } from '../../../common/thermal/utils/common';

export interface NusseltResult {
  Nu: number;
  h_W_m2K?: number;
  correlation: CorrelationName;
  regime: FlowRegime;
  isNatural: boolean;
  preferredRequested?: CorrelationName;
  preferredUsed: boolean;
  preferredRejectedReason?: string;
  warning?: string;
  rangeValid: boolean;
  allCorrelations?: Record<string, { Nu: number; rangeValid: boolean; warning?: string }>;
}

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

  /** h = Nu · λ / L */
  hFromNusselt(Nu: number, lambda: number, L: number): number {
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

  nusselt(params: DimensionlessInputDto): NusseltResult {
    const { geometry, dims = {}, preferredCorrelation, compareAll } = params;

    const Re     = this._resolveRe(params);
    const Pr     = this._resolvePr(params);
    const Gr     = params.Gr;
    const Ra     = params.Ra ?? (Gr !== undefined && Pr !== undefined ? Gr * Pr : undefined);
    const L      = ChannelGeometryHelper.characteristicLength(geometry, dims as GeometryDimsDto);
    const lambda = params.lambda_W_mK;

    const regime    = resolveRegime(geometry, Re, Ra, params.forceRegime);
    const isNatural = regime === FlowRegime.NATURAL;

    const available  = availableCorrelations(geometry);
    const allResults: Record<string, { Nu: number; rangeValid: boolean; warning?: string }> = {};
    for (const corr of available) {
      try {
        allResults[corr] = runCorrelation(corr, Re, Pr, Ra, params, regime);
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
        selectedCorr = bestCorrelation(geometry, Re, regime, params);
      }
    } else {
      selectedCorr = bestCorrelation(geometry, Re, regime, params);
    }

    const mainResult = allResults[selectedCorr]
      ?? runCorrelation(selectedCorr, Re, Pr, Ra, params, regime);
    const Nu      = mainResult.Nu;
    const h_W_m2K = lambda && L > 0 ? this.hFromNusselt(Nu, lambda, L) : undefined;

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

  // ── Private resolvers ──────────────────────────────────────────────────

  private _resolveRe(p: DimensionlessInputDto): number | undefined {
    if (p.Re !== undefined) return p.Re;
    if (p.rho_kg_m3 !== undefined && p.w_m_s !== undefined && p.mu_Pa_s !== undefined && p.dims) {
      const L = ChannelGeometryHelper.characteristicLength(p.geometry, p.dims as GeometryDimsDto);
      return this.reynolds(p.rho_kg_m3, p.w_m_s, L, p.mu_Pa_s);
    }
    return undefined;
  }

  private _resolvePr(p: DimensionlessInputDto): number | undefined {
    if (p.Pr !== undefined) return p.Pr;
    if (p.mu_Pa_s !== undefined && p.Cp_J_kgK !== undefined && p.lambda_W_mK !== undefined)
      return this.prandtl(p.mu_Pa_s, p.Cp_J_kgK, p.lambda_W_mK);
    return undefined;
  }
}
