import { Injectable } from '@nestjs/common';
import { RadiationService } from '../../thermodynamics/services/radiation.service';
import { DimensionlessCalculationService } from '../../thermodynamics/services/dimensionless-calculation.service';
import { FlowGeometry } from '../../thermodynamics/enums/flow-geometry.enum';
import { Species } from '../../thermodynamics/enums/species.enum';
import { RecuperatorHtcInputDto } from '../dto/recuperator-htc-input.dto';
import { RecuperatorHtcResultDto } from '../dto/recuperator-htc-result.dto';
import { AlphaResult } from '../interfaces/alpha-result.interface';
import { SmokeCompositionDto } from '../dto/smoke-composition.dto';
import { MultilayerWallService } from './multilayer-wall.service';
import { logMean } from '../../../common/utils/math.util';

const PURE_AIR: SmokeCompositionDto = {
  N2: 0.79, O2: 0.21, CO2: 0, CO: 0, H2O: 0, H2: 0,
};

/**
 * RecuperatorHtcService
 *
 * Computes the overall heat transfer coefficient at one cross-section of a
 * counter-flow recuperator:
 *   α_overall = 1 / (1/α_air + L_air/(L_smoke·α_smoke) + h_wall·L_air/(λ_wall·L_log))
 *
 * Both sides: forced convection (Nu via DimensionlessCalculationService) +
 *             gas radiation (Hottel–Mikheev via RadiationService).
 *
 * Source: legacy calculateCriteria() / getAverageAlpha() — recuperator.js ~1108, 1282
 */
@Injectable()
export class RecuperatorHtcService {

  constructor(
    private readonly radiation: RadiationService,
    private readonly dimensionless: DimensionlessCalculationService,
    private readonly wallService: MultilayerWallService,
  ) {}

  calculate(dto: RecuperatorHtcInputDto): RecuperatorHtcResultDto {
    const tWallSmoke = logMean(dto.tSmoke_K, dto.tAir_K);
    const tWallAir   = tWallSmoke;

    const alphaSmoke = this.sideAlpha(
      dto.tSmoke_K, tWallSmoke, dto.wSmoke_ms,
      dto.smokeComposition, dto.dSmoke_m, dto.lSmoke_m,
      dto.rayLengthSmoke_m, dto.smokeEmissivity, dto.length_m,
      dto.enableSmokeTurbulence ?? false,
    );

    const alphaAir = this.airSideAlpha(
      dto.tAir_K, tWallAir, dto.wAir_ms,
      dto.dAir_m, dto.lAir_m, dto.length_m,
      dto.airComposition ?? PURE_AIR,
      dto.rayLengthAir_m, dto.airEmissivity,
    );

    // Logarithmic mean perimeter (between air-side and smoke-side contact surfaces)
    const lLog = logMean(dto.lAir_m, dto.lSmoke_m);

    // Overall HTC: 1/(1/α_air + L_air/(L_smoke·α_smoke) + h·L_air/(λ·L_log))
    const alphaOverall_Wm2K = 1 / (
      1 / alphaAir.total_Wm2K
      + dto.lAir_m / (dto.lSmoke_m * alphaSmoke.total_Wm2K)
      + dto.wallThickness_m * dto.lAir_m / (dto.wallLambda_WmK * lLog)
    );

    return { alphaSmoke, alphaAir, alphaOverall_Wm2K };
  }

  private sideAlpha(
    tGas_K: number, tWall_K: number, w_ms: number,
    composition: SmokeCompositionDto, d_m: number, _l_m: number,
    rayLength_m: number, emissivity: number, length_m: number,
    turbulence: boolean,
  ): AlphaResult {
    const tAvg = logMean(tGas_K, tWall_K);
    const moleFractions: Record<string, number> = {
      [Species.N2]:  composition.N2,
      [Species.O2]:  composition.O2,
      [Species.CO2]: composition.CO2,
      [Species.CO]:  composition.CO,
      [Species.H2O]: composition.H2O,
      [Species.H2]:  composition.H2,
    };

    let convection_Wm2K = 0;
    try {
      const wEff = turbulence ? w_ms * 2 : w_ms;
      const result = this.dimensionless.nusselt({
        geometry:    FlowGeometry.PIPE_CIRCULAR,
        fluid:       'gas_mix',
        composition: moleFractions,
        T_fluid_K:   tAvg,
        T_surface_K: tWall_K,
        w_m_s:       wEff,
        dimensions:  { a: d_m, c: length_m },
      });
      convection_Wm2K = result.h_W_m2K ?? 0;
    } catch {
      convection_Wm2K = 0;
    }

    const radiation_Wm2K = this.radiation.gasRadiationHTC(
      tGas_K, tWall_K, emissivity,
      composition.H2O, composition.CO2, rayLength_m,
    );

    return {
      total_Wm2K:      convection_Wm2K + radiation_Wm2K,
      convection_Wm2K,
      radiation_Wm2K,
    };
  }

  private airSideAlpha(
    tAir_K: number, tWall_K: number, w_ms: number,
    d_m: number, _l_m: number, length_m: number,
    composition: SmokeCompositionDto,
    rayLength_m: number, emissivity: number,
  ): AlphaResult {
    const tAvg = logMean(tAir_K, tWall_K);
    const moleFractions: Record<string, number> = {
      [Species.N2]:  composition.N2,
      [Species.O2]:  composition.O2,
      [Species.CO2]: composition.CO2,
      [Species.CO]:  composition.CO,
      [Species.H2O]: composition.H2O,
      [Species.H2]:  composition.H2,
    };

    let convection_Wm2K = 0;
    try {
      const result = this.dimensionless.nusselt({
        geometry:    FlowGeometry.PIPE_CIRCULAR,
        fluid:       'gas_mix',
        composition: moleFractions,
        T_fluid_K:   tAvg,
        T_surface_K: tWall_K,
        w_m_s:       w_ms,
        dimensions:  { a: d_m, c: length_m },
      });
      convection_Wm2K = result.h_W_m2K ?? 0;
    } catch {
      convection_Wm2K = 0;
    }

    // Gas radiation: participates when air carries steam or flue-gas traces.
    // gasRadiationHTC already incorporates surface emissivity via Mikheev's
    // effective emissivity (ε_s+1)/2 — do NOT add solidRadiationHTC on top.
    // For pure dry air (non-participating medium), radiation is zero.
    const radiation_Wm2K = (composition.H2O > 0 || composition.CO2 > 0)
      ? this.radiation.gasRadiationHTC(
          tAir_K, tWall_K, emissivity,
          composition.H2O, composition.CO2, rayLength_m,
        )
      : 0;

    return {
      total_Wm2K:      convection_Wm2K + radiation_Wm2K,
      convection_Wm2K,
      radiation_Wm2K,
    };
  }
}
