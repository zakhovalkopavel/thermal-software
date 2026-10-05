import { Injectable } from '@nestjs/common';
import { RadiationService } from '../../thermodynamics/services/radiation.service';
import { DimensionlessCalculationService } from '../../thermodynamics/services/dimensionless-calculation.service';
import { RefractoryThermalService } from '../../refractory/services/catalog/refractory-thermal.service';
import { RefractoryThermalMaterial } from '../../refractory/enums/refractory-thermal-material.enum';
import { MetalThermalService } from '../../metals/services/metal-thermal.service';
import { MetalMaterial } from '../../metals/enums/metal-material.enum';
import { FlowGeometry } from '../../thermodynamics/enums/flow-geometry.enum';
import { Species } from '../../thermodynamics/enums/species.enum';
import { MultilayerWallInputDto } from '../dto/multilayer-wall-input.dto';
import { MultilayerWallResultDto, BetweenLayerDto } from '../dto/multilayer-wall-result.dto';
import { AlphaResult } from '../interfaces/alpha-result.interface';
import { WallBalance } from '../interfaces/wall-balance.interface';
import { WallGeometry } from '../enums/wall-geometry.enum';
import { WallMaterialKey } from '../dto/layer.dto';
import { SmokeCompositionDto } from '../dto/smoke-composition.dto';
import { kelvinToCelsius } from '../../../common/thermal/utils/temperature';
import { logMean } from '../../../common/utils/math';
import { brentq } from '../../../common/utils/root-finding';
import { MULTILAYER_WALL } from '../constants/multilayer-wall.constants';

const REFRACTORY_KEYS = new Set<string>(Object.values(RefractoryThermalMaterial));

/**
 * MultilayerWallService
 *
 * Computes steady-state heat transfer through a multilayer cylindrical or flat wall
 * separating hot combustion gases from ambient air.
 *
 * Algorithm (Brent root finding on inner surface temperature, T_inner ∈ [T_ambient, T_flame]):
 *   1. For a trial T_inner compute inner gas→surface HTC (convection + gas radiation)
 *   2. Walk finite-difference steps outward through each layer (λ(T) per material)
 *   3. Compute outer surface natural convection + radiation HTC
 *   4. Solve Q_inner − Q_outer = 0 with brentq (Q_outer = 0 if the traverse drops below T_ambient)
 *
 * Source: legacy recuperator.js heatFluxFurnaceMultyLayer() lines 2194–2320
 */
@Injectable()
export class MultilayerWallService {

  constructor(
    private readonly refractoryThermal: RefractoryThermalService,
    private readonly metalThermal: MetalThermalService,
    private readonly radiation: RadiationService,
    private readonly dimensionless: DimensionlessCalculationService,
  ) {}

  calculate(dto: MultilayerWallInputDto): MultilayerWallResultDto {
    const {
      geometry, a_m, tFlame_K, tAmbient_K,
      innerEmissivity, w_ms, composition, mPerSecond_kgs,
    } = dto;
    const b_m        = dto.b_m        ?? 1;
    const nSteps     = dto.numberOfSteps ?? 50;

    const totalH_m        = dto.layers.reduce((s, l) => s + l.thicknessMm / 1000, 0);
    const totalThickness_mm = totalH_m * 1000;
    const stepSize_m      = totalH_m / nSteps;

    const sInner = this.surfaceArea(geometry, a_m, b_m, 0);
    const sOuter = this.surfaceArea(geometry, a_m, b_m, totalH_m);
    const rayLength_m = 0.9 * a_m;

    const wallBalance = (tInner: number): WallBalance => {
      // ── Step A: inner gas → wall HTC ──────────────────────────────────────
      const alphaInner  = this.innerGasAlpha(tFlame_K, tInner, innerEmissivity, composition, a_m, rayLength_m, w_ms);
      const fluxInner_W = alphaInner.total_Wm2K * (tFlame_K - tInner) * sInner;

      // ── Step B: finite-difference traverse through layers ─────────────────
      const betweenTemps: BetweenLayerDto[] = [];
      let tCurrent   = tInner;
      let x          = 0;
      let layerIdx   = 0;
      let prevLayerIdx = -1;
      let broke = false;

      for (let j = 0; j < nSteps; j++) {
        const xMid = x + stepSize_m / 2;

        // determine which layer xMid falls in
        let cumul = 0;
        layerIdx = dto.layers.length - 1;
        for (let li = 0; li < dto.layers.length; li++) {
          cumul += dto.layers[li].thicknessMm / 1000;
          if (xMid < cumul) { layerIdx = li; break; }
        }

        // record between-layer temperature when crossing a boundary
        if (layerIdx !== prevLayerIdx && prevLayerIdx >= 0) {
          betweenTemps.push({
            name:     `layer_${prevLayerIdx}_to_${layerIdx}`,
            tCelsius: kelvinToCelsius(tCurrent),
          });
        }
        prevLayerIdx = layerIdx;

        const mat    = dto.layers[layerIdx].material;
        const lambda = this.getLambda(mat, tCurrent);
        const xNext  = x + stepSize_m;
        const sCurr  = this.surfaceArea(geometry, a_m, b_m, x);
        const sNext  = this.surfaceArea(geometry, a_m, b_m, xNext);
        const sAvg   = (sCurr + sNext) / 2;
        const dT     = (fluxInner_W * stepSize_m) / (sAvg * lambda);

        tCurrent -= dT;
        x = xNext;

        if (tCurrent < tAmbient_K) { broke = true; break; }
      }

      if (broke) {
        return { alphaInner, fluxInner_W, alphaOuter_Wm2K: 0, fluxOuter_W: 0, tOuter: tCurrent, betweenTemps, broke };
      }

      // ── Step C: outer surface HTC ─────────────────────────────────────────
      const lSurface = Math.sqrt(sOuter);
      const dSurface = a_m + 2 * totalH_m;
      const alphaOuter_Wm2K = this.outerAlpha(tCurrent, tAmbient_K, lSurface, dSurface, innerEmissivity);
      const fluxOuter_W     = alphaOuter_Wm2K * (tCurrent - tAmbient_K) * sOuter;

      return { alphaInner, fluxInner_W, alphaOuter_Wm2K, fluxOuter_W, tOuter: tCurrent, betweenTemps, broke };
    };

    // ── Step D: Q_inner − Q_outer = 0; a wall too cold to reach T_ambient has Q_outer = 0 ──
    const balanceResidual = (tInner: number): number => {
      const b = wallBalance(tInner);
      return b.fluxInner_W - b.fluxOuter_W;
    };
    const tInner = brentq(balanceResidual, tAmbient_K, tFlame_K, MULTILAYER_WALL.ROOT_TOL_K).root;
    const { alphaInner, fluxInner_W, alphaOuter_Wm2K, fluxOuter_W, tOuter, betweenTemps } = wallBalance(tInner);

    // ── Gas cooling estimate (log-mean) ───────────────────────────────────────
    const tGasAverage_K = logMean(tFlame_K, tInner);
    const tGasEnd_K     = tInner; // simplified: gas reaches wall temp

    return {
      tInner_K:             tInner,
      tOuter_K:             tOuter,
      tGasEnd_K,
      tGasAverage_K,
      betweenLayers:        betweenTemps,
      fluxInner_W,
      fluxOuter_W,
      fluxInnerDensity_Wm2: sInner > 0 ? fluxInner_W / sInner : 0,
      sInner_m2:            sInner,
      sOuter_m2:            sOuter,
      alphaInner,
      alphaOuter_Wm2K,
      totalThickness_mm,
    };
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private surfaceArea(geometry: WallGeometry, a_m: number, b_m: number, depth_m: number): number {
    switch (geometry) {
      case WallGeometry.FLAT:
        return a_m * b_m;
      case WallGeometry.CYLINDER:
        return 2 * Math.PI * (a_m / 2 + depth_m) * b_m;
      case WallGeometry.SPHERE:
        return 4 * Math.PI * Math.pow(a_m / 2 + depth_m, 2);
    }
  }

  private innerGasAlpha(
    tFlame_K: number, tInner_K: number, emissivity: number,
    composition: SmokeCompositionDto, d_m: number, rayLength_m: number, w_ms: number,
  ): AlphaResult {
    const tAvg = logMean(tFlame_K, tInner_K);

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
        T_surface_K: tInner_K,
        w_m_s:       w_ms,
        dimensions:  { a: d_m },
      });
      convection_Wm2K = result.h_W_m2K ?? 0;
    } catch {
      convection_Wm2K = 0;
    }

    const radiation_Wm2K = this.radiation.gasRadiationHTC(
      tFlame_K, tInner_K, emissivity,
      composition.H2O, composition.CO2, rayLength_m,
    );

    return {
      total_Wm2K:      convection_Wm2K + radiation_Wm2K,
      convection_Wm2K,
      radiation_Wm2K,
    };
  }

  private outerAlpha(
    tOuter_K: number, tAmbient_K: number,
    lSurface_m: number, dSurface_m: number, emissivity: number,
  ): number {
    if (tOuter_K <= MULTILAYER_WALL.LOW_TEMP_THRESHOLD_K) {
      return MULTILAYER_WALL.LOW_TEMP_ALPHA_BASE_W_M2K
        + MULTILAYER_WALL.LOW_TEMP_ALPHA_SLOPE_W_M2K2 * (tOuter_K - tAmbient_K);
    }

    let convection_Wm2K = 0;
    try {
      const result = this.dimensionless.nusselt({
        geometry:    FlowGeometry.VERTICAL_CYLINDER,
        fluid:       'air',
        T_fluid_K:   tAmbient_K,
        T_surface_K: tOuter_K,
        w_m_s:       0,
        dimensions:  { a: dSurface_m, b: lSurface_m },
      });
      convection_Wm2K = result.h_W_m2K ?? 0;
    } catch {
      convection_Wm2K = 0;
    }

    const radiation_Wm2K = this.radiation.solidRadiationHTC(tOuter_K, tAmbient_K, emissivity, 1.0);
    return convection_Wm2K + radiation_Wm2K;
  }

  getLambda(material: WallMaterialKey, T_K: number): number {
    if (REFRACTORY_KEYS.has(material)) {
      return this.refractoryThermal.lambda(material as RefractoryThermalMaterial, T_K);
    }
    return this.metalThermal.lambda(material as MetalMaterial, T_K);
  }

  getEmissivity(material: WallMaterialKey, T_K: number): number {
    if (REFRACTORY_KEYS.has(material)) {
      return this.refractoryThermal.emissivity(material as RefractoryThermalMaterial, T_K);
    }
    return this.metalThermal.emissivity(material as MetalMaterial, T_K);
  }
}
