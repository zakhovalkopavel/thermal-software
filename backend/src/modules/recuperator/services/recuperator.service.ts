import { Injectable } from '@nestjs/common';
import { GasPropertiesService } from '../../thermodynamics/services/gas-properties.service';
import { Species } from '../../thermodynamics/enums/species.enum';
import { CombustionService } from '../../combustion/services/combustion.service';
import { RecuperatorHtcService } from '../../thermal-exchange/services/recuperator-htc.service';
import { MultilayerWallService } from '../../thermal-exchange/services/multilayer-wall.service';
import { RecuperatorGeometryService } from './recuperator-geometry.service';
import { RecuperatorInputDto } from '../dto/recuperator-input.dto';
import { RecuperatorResultDto } from '../dto/recuperator-result.dto';
import { RECUPERATOR } from '../constants/recuperator.constants';
import { COMBUSTION } from '../../combustion/constants/combustion.constants';
import { GasMoleFractions } from '../../combustion/dto/combustion-result.dto';
import { HoleForm } from '../enums/hole-form.enum';
import { logMean } from '../../../common/utils/math.util';

/**
 * RecuperatorService
 *
 * Counter-flow heat exchanger optimiser using 8-neighbour grid search.
 *
 * Finds (T_smoke_end, T_air_end) minimising the energy imbalance:
 *   criterion = |Q_smoke − Q_air − Q_loss| + |Q_smoke − Q_air − Q_loss · L/L_target|
 *
 * Source: legacy calculate() + calculateCriteria() — recuperator.js lines 1282–1548
 */
@Injectable()
export class RecuperatorService {

  constructor(
    private readonly combustion: CombustionService,
    private readonly geometry: RecuperatorGeometryService,
    private readonly htc: RecuperatorHtcService,
    private readonly wallService: MultilayerWallService,
    private readonly gasProps: GasPropertiesService,
  ) {}

  calculate(dto: RecuperatorInputDto): RecuperatorResultDto {
    const {
      fPower_W, fuelQ_Jkg, kExcessAir, tAirStart_K,
      holeForm, d0_m, refractoryThickness_m, nAir, nSmoke,
      wantedRecuperatorLength_m, refractoryLambda_WmK, refractoryEmissivity,
      surfaceEmissivity, surfaceArea_m2, thermalInsulationThickness_m,
    } = dto;

    const h0_m    = dto.h0_m    ?? 0.02;
    const nPasses = dto.nPasses ?? 1;
    const turbulence = dto.smokeTurbulence ?? false;
    const pO2    = dto.pO2    ?? COMBUSTION.DEFAULT_PO2;
    const wH2Om  = dto.wH2Om  ?? COMBUSTION.DEFAULT_W_H2OM;
    const airPreheat_K = dto.airPreheat_K ?? 0;

    // ── Geometry ──────────────────────────────────────────────────────────────
    const sAir_m2   = this.geometry.getArea(d0_m, holeForm, 'air',   nAir, nSmoke, refractoryThickness_m, h0_m, nPasses);
    const sSmoke_m2 = this.geometry.getArea(d0_m, holeForm, 'smoke', nAir, nSmoke, refractoryThickness_m, h0_m, nPasses);
    const lAir_m    = this.geometry.getPerimeter(d0_m, holeForm, 'air',   nAir, nSmoke, refractoryThickness_m);
    const lSmoke_m  = this.geometry.getPerimeter(d0_m, holeForm, 'smoke', nAir, nSmoke, refractoryThickness_m);
    const dAir_m    = this.geometry.dEq(sAir_m2);
    const dSmoke_m  = this.geometry.dEq(sSmoke_m2);
    const rayLengthSmoke_m = this.geometry.getRayLength(holeForm, d0_m, refractoryThickness_m, h0_m, 'smoke');
    const rayLengthAir_m   = this.geometry.getRayLength(holeForm, d0_m, refractoryThickness_m, h0_m, 'air');

    // ── Initial combustion ────────────────────────────────────────────────────
    const combustionResult = this.combustion.calculate({
      fPower_W, fuelQ_Jkg, kExcessAir, tAirStart_K, pO2, wH2Om,
    });

    const { tSmokeStart_K, mSmoke_kgs, mAir_kgs, mFuel_kgs, composition } = combustionResult;
    const smokeComp = composition.after;

    // ── Initial velocity ──────────────────────────────────────────────────────
    const atm = COMBUSTION.ATMOSPHERIC_PRESSURE_PA;
    const rhoAirStart  = atm / (287.4 * tAirStart_K);
    const rhoSmokeStart = atm / (287.4 * tSmokeStart_K);

    const wAirStart_ms   = mAir_kgs   / (rhoAirStart   * sAir_m2);
    const wSmokeStart_ms = mSmoke_kgs / (rhoSmokeStart  * sSmoke_m2);

    // ── Optimizer initial state ───────────────────────────────────────────────
    let tSmokeEnd_K = tAirStart_K * COMBUSTION.FLAME_TO_SMOKE_RATIO;
    let tAirEnd_K   = tSmokeStart_K / COMBUSTION.FLAME_TO_SMOKE_RATIO;

    // Clamp
    tSmokeEnd_K = Math.min(tSmokeEnd_K, tSmokeStart_K - 1);
    tAirEnd_K   = Math.max(tAirEnd_K,   tAirStart_K   + 1);

    const evalCriteria = (tse: number, tae: number): number => {
      return this.criterion(
        tse, tae, tSmokeStart_K, tAirStart_K,
        mSmoke_kgs, mAir_kgs, smokeComp, composition.before,
        wAirStart_ms, wSmokeStart_ms, sAir_m2, sSmoke_m2,
        lAir_m, lSmoke_m, dAir_m, dSmoke_m,
        rayLengthSmoke_m, rayLengthAir_m,
        refractoryThickness_m, refractoryLambda_WmK, refractoryEmissivity,
        wantedRecuperatorLength_m, turbulence,
        surfaceArea_m2, thermalInsulationThickness_m, surfaceEmissivity,
        dto,
      );
    };

    // ── 8-neighbour grid search ───────────────────────────────────────────────
    for (let i = 1; i < RECUPERATOR.MAX_ITERATIONS; i++) {
      const divider = 2 + Math.pow(i / 5, 2);
      const dSmoke  = (tSmokeStart_K - tSmokeEnd_K) / divider;
      const dAir    = (tAirEnd_K - tAirStart_K)     / divider;

      if (dSmoke < RECUPERATOR.DT_MIN_K && dAir < RECUPERATOR.DT_MIN_K) break;

      const current = evalCriteria(tSmokeEnd_K, tAirEnd_K);
      if (current < RECUPERATOR.CRITERIA_THRESHOLD) break;

      const candidates: Array<[number, number, number]> = [
        [current, tSmokeEnd_K,         tAirEnd_K],
        [evalCriteria(tSmokeEnd_K,         tAirEnd_K - dAir),  tSmokeEnd_K,         tAirEnd_K - dAir],
        [evalCriteria(tSmokeEnd_K,         tAirEnd_K + dAir),  tSmokeEnd_K,         tAirEnd_K + dAir],
        [evalCriteria(tSmokeEnd_K - dSmoke, tAirEnd_K),         tSmokeEnd_K - dSmoke, tAirEnd_K],
        [evalCriteria(tSmokeEnd_K - dSmoke, tAirEnd_K - dAir),  tSmokeEnd_K - dSmoke, tAirEnd_K - dAir],
        [evalCriteria(tSmokeEnd_K - dSmoke, tAirEnd_K + dAir),  tSmokeEnd_K - dSmoke, tAirEnd_K + dAir],
        [evalCriteria(tSmokeEnd_K + dSmoke, tAirEnd_K),         tSmokeEnd_K + dSmoke, tAirEnd_K],
        [evalCriteria(tSmokeEnd_K + dSmoke, tAirEnd_K - dAir),  tSmokeEnd_K + dSmoke, tAirEnd_K - dAir],
        [evalCriteria(tSmokeEnd_K + dSmoke, tAirEnd_K + dAir),  tSmokeEnd_K + dSmoke, tAirEnd_K + dAir],
      ];

      candidates.sort((a, b) => a[0] - b[0]);
      tSmokeEnd_K = candidates[0][1];
      tAirEnd_K   = candidates[0][2];
    }

    // ── Final result ──────────────────────────────────────────────────────────
    const rhoAirEnd    = atm / (287.4 * tAirEnd_K);
    const rhoSmokeEnd  = atm / (287.4 * tSmokeEnd_K);
    const wAirEnd_ms   = mAir_kgs   / (rhoAirEnd   * sAir_m2);
    const wSmokeEnd_ms = mSmoke_kgs / (rhoSmokeEnd  * sSmoke_m2);

    const [qSmoke, qAir] = this.energyFlows(
      tSmokeStart_K, tSmokeEnd_K, tAirStart_K, tAirEnd_K,
      mSmoke_kgs, mAir_kgs, smokeComp, composition.before,
    );

    const smokeTotalEnergy_W = this.gasEnergy(
      smokeComp, mSmoke_kgs, tSmokeStart_K, tAirStart_K,
    );

    const { alphaAvg, deltaT_lm, L_recuperator } = this.computeLength(
      tSmokeStart_K, tSmokeEnd_K, tAirStart_K, tAirEnd_K,
      qAir, lAir_m, lSmoke_m, dAir_m, dSmoke_m,
      wAirStart_ms, wSmokeStart_ms,
      rayLengthSmoke_m, rayLengthAir_m,
      smokeComp, composition.before,
      refractoryThickness_m, refractoryLambda_WmK, refractoryEmissivity,
      wantedRecuperatorLength_m, turbulence, dto,
    );

    // Max flame with preheated air
    const maxCombustion = this.combustion.calculate({
      fPower_W, fuelQ_Jkg, kExcessAir,
      tAirStart_K: tAirStart_K + airPreheat_K,
      pO2, wH2Om,
    });

    return {
      recuperatorLength_m:   L_recuperator,
      tAirEnd_K,
      tSmokeEnd_K,
      tSmokeStart_K,
      tFlame_K:              combustionResult.tFlame_K,
      maxFlameTemp_K:        maxCombustion.tFlame_K,
      energyReturnedPercent: smokeTotalEnergy_W > 0 ? (qAir / smokeTotalEnergy_W) * 100 : 0,
      airEnergyIncrease_W:   qAir,
      smokeEnergyDecrease_W: qSmoke,
      smokeTotalEnergy_W,
      alphaAverage_Wm2K:     alphaAvg,
      averageDeltaT_K:       deltaT_lm,
      sSmoke_m2,
      sAir_m2,
      dAir_m,
      dSmoke_m,
      wSmokeStart_ms,
      wSmokeEnd_ms,
      wAirStart_ms,
      wAirEnd_ms,
      mFuel_kgh: mFuel_kgs * 3600,
    };
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private criterion(
    tSmokeEnd_K: number, tAirEnd_K: number,
    tSmokeStart_K: number, tAirStart_K: number,
    mSmoke_kgs: number, mAir_kgs: number,
    smokeComp: GasMoleFractions, airComp: GasMoleFractions,
    wAirStart_ms: number, wSmokeStart_ms: number,
    sAir_m2: number, sSmoke_m2: number,
    lAir_m: number, lSmoke_m: number,
    dAir_m: number, dSmoke_m: number,
    rayLengthSmoke_m: number, rayLengthAir_m: number,
    wallThickness_m: number, wallLambda_WmK: number, wallEmissivity: number,
    wantedLength_m: number, turbulence: boolean,
    surfaceArea_m2: number, insulationThickness_m: number, surfaceEmissivity: number,
    dto: RecuperatorInputDto,
  ): number {
    // Validate bounds
    if (tSmokeEnd_K <= tAirStart_K || tSmokeEnd_K >= tSmokeStart_K) return RECUPERATOR.ENERGY_CRITERIA_ERROR;
    if (tAirEnd_K   >= tSmokeStart_K || tAirEnd_K   <= tAirStart_K)  return RECUPERATOR.ENERGY_CRITERIA_ERROR;

    const atm = COMBUSTION.ATMOSPHERIC_PRESSURE_PA;
    const rhoAirEnd    = atm / (287.4 * tAirEnd_K);
    const rhoSmokeEnd  = atm / (287.4 * tSmokeEnd_K);
    const wAirEnd_ms   = mAir_kgs   / (rhoAirEnd   * sAir_m2);
    const wSmokeEnd_ms = mSmoke_kgs / (rhoSmokeEnd  * sSmoke_m2);

    const [qSmoke, qAir] = this.energyFlows(
      tSmokeStart_K, tSmokeEnd_K, tAirStart_K, tAirEnd_K,
      mSmoke_kgs, mAir_kgs, smokeComp, airComp,
    );

    if (qSmoke < qAir || qAir < 0) return RECUPERATOR.ENERGY_CRITERIA_ERROR;

    const { alphaAvg, deltaT_lm, L_recuperator } = this.computeLength(
      tSmokeStart_K, tSmokeEnd_K, tAirStart_K, tAirEnd_K,
      qAir, lAir_m, lSmoke_m, dAir_m, dSmoke_m,
      wAirStart_ms, wSmokeStart_ms,
      rayLengthSmoke_m, rayLengthAir_m,
      smokeComp, airComp,
      wallThickness_m, wallLambda_WmK, wallEmissivity,
      wantedLength_m, turbulence, dto,
    );

    const realEnergyBalance     = qSmoke - qAir;
    const currentEnergyBalance  = qSmoke - qAir;
    return Math.abs(realEnergyBalance) + Math.abs(currentEnergyBalance);
  }

  private computeLength(
    tSmokeStart_K: number, tSmokeEnd_K: number, tAirStart_K: number, tAirEnd_K: number,
    qAir: number,
    lAir_m: number, lSmoke_m: number, dAir_m: number, dSmoke_m: number,
    wAirStart_ms: number, wSmokeStart_ms: number,
    rayLengthSmoke_m: number, rayLengthAir_m: number,
    smokeComp: GasMoleFractions, airComp: GasMoleFractions,
    wallThickness_m: number, wallLambda_WmK: number, wallEmissivity: number,
    wantedLength_m: number, turbulence: boolean,
    dto: RecuperatorInputDto,
  ): { alphaAvg: number; deltaT_lm: number; L_recuperator: number } {
    const lm = logMean;

    // Wall surface temperature at each cross-section
    const tWall1 = lm(tSmokeStart_K, tAirEnd_K);
    const tWall2 = lm(tSmokeEnd_K,   tAirStart_K);

    const smokeMoles: Record<string, number> = {
      [Species.N2]: smokeComp.N2, [Species.O2]: smokeComp.O2,
      [Species.CO2]: smokeComp.CO2, [Species.CO]: smokeComp.CO,
      [Species.H2O]: smokeComp.H2O, [Species.H2]: smokeComp.H2,
    };
    const mSmokeSmall = this.gasProps.molecularWeight(smokeMoles as any);

    const htcAt = (tSmoke: number, tAir: number, tWall: number, wAir: number, wSmoke: number) =>
      this.htc.calculate({
        tSmoke_K: tSmoke, wSmoke_ms: wSmoke,
        smokeComposition: smokeComp as any,
        dSmoke_m, lSmoke_m, rayLengthSmoke_m,
        smokeEmissivity: wallEmissivity,
        tAir_K: tAir, wAir_ms: wAir,
        dAir_m, lAir_m, rayLengthAir_m,
        airEmissivity: wallEmissivity,
        wallThickness_m, wallLambda_WmK,
        length_m: wantedLength_m,
        enableSmokeTurbulence: turbulence,
      });

    const r1 = htcAt(tSmokeStart_K, tAirEnd_K,   tWall1, wAirStart_ms,  wSmokeStart_ms);
    const r2 = htcAt(tSmokeEnd_K,   tAirStart_K,  tWall2, wAirStart_ms,  wSmokeStart_ms);

    const alphaAvg   = lm(r1.alphaOverall_Wm2K, r2.alphaOverall_Wm2K);
    const dt1        = tSmokeStart_K - tAirEnd_K;
    const dt2        = tSmokeEnd_K   - tAirStart_K;
    const deltaT_lm  = lm(dt1 > 0 ? dt1 : 1e-6, dt2 > 0 ? dt2 : 1e-6);
    const L_recuperator = alphaAvg > 0 && deltaT_lm > 0 && lAir_m > 0
      ? qAir / (alphaAvg * deltaT_lm * lAir_m)
      : wantedLength_m;

    return { alphaAvg, deltaT_lm, L_recuperator };
  }

  /** Gas enthalpy change [W] using cpMixture */
  private gasEnergy(
    comp: GasMoleFractions, massFlow_kgs: number, T1_K: number, T2_K: number,
  ): number {
    const moles: Partial<Record<Species, number>> = {
      [Species.N2]: comp.N2, [Species.O2]: comp.O2,
      [Species.CO2]: comp.CO2, [Species.CO]: comp.CO,
      [Species.H2O]: comp.H2O, [Species.H2]: comp.H2,
    };
    const M = this.gasProps.molecularWeight(moles);
    const cp_J_molK = this.gasProps.cpMixture(moles, (T1_K + T2_K) / 2);
    const cp_J_kgK  = cp_J_molK / M;
    return Math.abs(cp_J_kgK * massFlow_kgs * (T1_K - T2_K));
  }

  private energyFlows(
    tSmokeStart_K: number, tSmokeEnd_K: number,
    tAirStart_K: number,   tAirEnd_K: number,
    mSmoke_kgs: number, mAir_kgs: number,
    smokeComp: GasMoleFractions, airComp: GasMoleFractions,
  ): [number, number] {
    const qSmoke = this.gasEnergy(smokeComp, mSmoke_kgs, tSmokeStart_K, tSmokeEnd_K);
    const qAir   = this.gasEnergy(airComp,   mAir_kgs,   tAirEnd_K,     tAirStart_K);
    return [qSmoke, qAir];
  }
}
