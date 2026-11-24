import { Injectable } from '@nestjs/common';
import { CombustionService } from '../../combustion/services/combustion.service';
import { RecuperatorGeometryService } from './recuperator-geometry.service';
import { RecuperatorBalanceService } from './recuperator-balance.service';
import { RecuperatorInputDto } from '../dto/recuperator-input.dto';
import { RecuperatorResultDto } from '../dto/recuperator-result.dto';
import { RECUPERATOR } from '../constants/recuperator.constants';
import { COMBUSTION } from '../../combustion/constants';
import { RecuperatorSmoke } from '../utils/recuperator-smoke';

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
    private readonly balance: RecuperatorBalanceService,
  ) {}

  calculate(dto: RecuperatorInputDto): RecuperatorResultDto {
    const {
      tAirStart_K,
      holeForm, d0_m, refractoryThickness_m, nAir, nSmoke,
      wantedRecuperatorLength_m, refractoryLambda_WmK, refractoryEmissivity,
      surfaceEmissivity, surfaceArea_m2, thermalInsulationThickness_m,
    } = dto;

    const h0_m    = dto.h0_m    ?? 0.02;
    const nPasses = dto.nPasses ?? 1;
    const turbulence = dto.smokeTurbulence ?? false;
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

    // ── Combustion (selected mode) ────────────────────────────────────────────
    const flue = this.combustion.flueGas(dto.combustion);
    const tSmokeStart_K = Math.min(flue.tFlame_K / RECUPERATOR.FLAME_TO_SMOKE_RATIO, RECUPERATOR.T_SMOKE_START_MAX_K);
    const { mAir_kgs, mFuel_kgs } = flue;
    const mSmoke_kgs = flue.mFlueGas_kgs;
    const smokeComp = RecuperatorSmoke.toComposition(flue.moleFractions);
    const composition = {
      before: { N2: 1 - flue.pO2, O2: flue.pO2, CO2: 0, CO: 0, H2O: 0, H2: 0 },
      after:  smokeComp,
    };

    // ── Initial velocity ──────────────────────────────────────────────────────
    const atm = COMBUSTION.ATMOSPHERIC_PRESSURE_PA;
    const rhoAirStart  = atm / (RECUPERATOR.R_SPECIFIC_DRY_AIR_J_KGK * tAirStart_K);
    const rhoSmokeStart = atm / (RECUPERATOR.R_SPECIFIC_DRY_AIR_J_KGK * tSmokeStart_K);

    const wAirStart_ms   = mAir_kgs   / (rhoAirStart   * sAir_m2);
    const wSmokeStart_ms = mSmoke_kgs / (rhoSmokeStart  * sSmoke_m2);

    // ── Optimizer initial state ───────────────────────────────────────────────
    let tSmokeEnd_K = tAirStart_K * RECUPERATOR.FLAME_TO_SMOKE_RATIO;
    let tAirEnd_K   = tSmokeStart_K / RECUPERATOR.FLAME_TO_SMOKE_RATIO;

    // Clamp
    tSmokeEnd_K = Math.min(tSmokeEnd_K, tSmokeStart_K - 1);
    tAirEnd_K   = Math.max(tAirEnd_K,   tAirStart_K   + 1);

    const evalCriteria = (tse: number, tae: number): number => {
      return this.balance.criterion(
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
    const rhoAirEnd    = atm / (RECUPERATOR.R_SPECIFIC_DRY_AIR_J_KGK * tAirEnd_K);
    const rhoSmokeEnd  = atm / (RECUPERATOR.R_SPECIFIC_DRY_AIR_J_KGK * tSmokeEnd_K);
    const wAirEnd_ms   = mAir_kgs   / (rhoAirEnd   * sAir_m2);
    const wSmokeEnd_ms = mSmoke_kgs / (rhoSmokeEnd  * sSmoke_m2);

    const [qSmoke, qAir] = this.balance.energyFlows(
      tSmokeStart_K, tSmokeEnd_K, tAirStart_K, tAirEnd_K,
      mSmoke_kgs, mAir_kgs, smokeComp, composition.before,
    );

    const smokeTotalEnergy_W = this.balance.gasEnergy(
      smokeComp, mSmoke_kgs, tSmokeStart_K, tAirStart_K,
    );

    const { alphaAvg, deltaT_lm, L_recuperator } = this.balance.computeLength(
      tSmokeStart_K, tSmokeEnd_K, tAirStart_K, tAirEnd_K,
      qAir, lAir_m, lSmoke_m, dAir_m, dSmoke_m,
      wAirStart_ms, wSmokeStart_ms,
      rayLengthSmoke_m, rayLengthAir_m,
      smokeComp, composition.before,
      refractoryThickness_m, refractoryLambda_WmK, refractoryEmissivity,
      wantedRecuperatorLength_m, turbulence, dto,
    );

    // Max flame with preheated combustion air
    const maxFlameTemp_K = airPreheat_K === 0
      ? flue.tFlame_K
      : this.combustion.flueGas(dto.combustion, airPreheat_K).tFlame_K;

    return {
      recuperatorLength_m:   L_recuperator,
      tAirEnd_K,
      tSmokeEnd_K,
      tSmokeStart_K,
      tFlame_K:              flue.tFlame_K,
      maxFlameTemp_K,
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

}
