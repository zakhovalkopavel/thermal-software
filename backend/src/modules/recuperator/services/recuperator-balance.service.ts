import { Injectable } from '@nestjs/common';
import { GasPropertiesService } from '../../thermodynamics/services/gas-properties.service';
import { Species } from '../../thermodynamics/enums/species.enum';
import { RecuperatorHtcService } from '../../thermal-exchange/services/recuperator-htc.service';
import { SmokeCompositionDto } from '../../thermal-exchange/dto/smoke-composition.dto';
import { RecuperatorInputDto } from '../dto/recuperator-input.dto';
import { RECUPERATOR } from '../constants/recuperator.constants';
import { COMBUSTION } from '../../combustion/constants';
import { logMean } from '../../../common/utils/math';

type GasMoleFractions = SmokeCompositionDto;

/**
 * Energy-balance and length helpers for the recuperator grid-search optimiser.
 */
@Injectable()
export class RecuperatorBalanceService {
  constructor(
    private readonly htc: RecuperatorHtcService,
    private readonly gasProps: GasPropertiesService,
  ) {}

  criterion(
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
    const rhoAirEnd    = atm / (RECUPERATOR.R_SPECIFIC_DRY_AIR_J_KGK * tAirEnd_K);
    const rhoSmokeEnd  = atm / (RECUPERATOR.R_SPECIFIC_DRY_AIR_J_KGK * tSmokeEnd_K);
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

  computeLength(
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
  gasEnergy(
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

  energyFlows(
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
