import { Injectable } from '@nestjs/common';
import { GasPropertiesService } from '../../thermodynamics/services/gas-properties.service';
import { Species } from '../../thermodynamics/enums/species.enum';
import { CombustionInputDto } from '../dto/combustion-input.dto';
import { CombustionResultDto, GasMoleFractions } from '../dto/combustion-result.dto';
import { COMBUSTION, MOLAR_MASS } from '../constants/combustion.constants';

@Injectable()
export class CombustionService {
  constructor(private readonly gasProps: GasPropertiesService) {}

  calculate(dto: CombustionInputDto): CombustionResultDto {
    const {
      fPower_W,
      fuelQ_Jkg,
      kExcessAir,
      tAirStart_K,
    } = dto;

    const carbonQ   = dto.carbonQ_Jkg       ?? COMBUSTION.Q_CARBON_J_KG;
    const pO2       = dto.pO2               ?? COMBUSTION.DEFAULT_PO2;
    const wH2Om     = dto.wH2Om             ?? COMBUSTION.DEFAULT_W_H2OM;
    const genLoss_W = dto.generatorHeatLoss_W ?? 0;

    // ── Mass flows ────────────────────────────────────────────────────────────
    const mFuel_kgs   = fPower_W / fuelQ_Jkg;
    const mCarbon_kgs = (fuelQ_Jkg / carbonQ) * mFuel_kgs;

    const mAir_kgs = kExcessAir * (32 / (pO2 * 12)) * mCarbon_kgs;
    const mN2_kgs  = mAir_kgs * ((1 - pO2) * MOLAR_MASS.N2)
                   / ((1 - pO2) * MOLAR_MASS.N2 + MOLAR_MASS.O2 * pO2);
    const mO2_kgs  = mAir_kgs - mN2_kgs;

    // ── Combustion fractions ──────────────────────────────────────────────────
    const k = kExcessAir;
    let kCO2 = k >= 1 ? 1 : (k > 0.5 ? 2 * k - 1 : 0);
    let kCO  = k >= 1 ? 0 : (k > 0.5 ? 2 - 2 * k  : 2 * k);

    // Water-gas shift: CO + H₂O → CO₂ + H₂
    const mH2O_kgs = mAir_kgs * wH2Om;
    const kH2O     = (mH2O_kgs * 12) / (MOLAR_MASS.H2O * 1000 * mCarbon_kgs);
    const kH2      = k <= 1 ? Math.min(kH2O, kCO) : 0;

    if (kH2 > 0) {
      kCO2 += kH2;
      kCO  -= kH2;
    }

    const kH2OAfter = kH2O - kH2;

    // ── Product masses ────────────────────────────────────────────────────────
    const mCO2_kgs    = (44 / 12) * mCarbon_kgs * kCO2;
    const mCO_kgs     = (28 / 12) * mCarbon_kgs * kCO;
    const mH2_kgs     = (2  / 12) * mCarbon_kgs * kH2;
    const mH2OAft_kgs = (12 / 12) * mCarbon_kgs * kH2OAfter;
    const mO2Aft_kgs  = k > 1 ? (k - 1) * mO2_kgs : 0;

    const mSmoke_kgs = mN2_kgs + mO2Aft_kgs + mCO2_kgs + mCO_kgs + mH2OAft_kgs + mH2_kgs;

    // ── Mole fractions (after combustion) ────────────────────────────────────
    const afterMoles = {
      N2:  mN2_kgs    / MOLAR_MASS.N2,
      O2:  mO2Aft_kgs / MOLAR_MASS.O2,
      CO2: mCO2_kgs   / MOLAR_MASS.CO2,
      CO:  mCO_kgs    / MOLAR_MASS.CO,
      H2O: mH2OAft_kgs / MOLAR_MASS.H2O,
      H2:  mH2_kgs    / MOLAR_MASS.H2,
    };
    const totalAfterMoles = Object.values(afterMoles).reduce((a, b) => a + b, 0);
    const afterFrac: GasMoleFractions = {
      N2:  afterMoles.N2  / totalAfterMoles,
      O2:  afterMoles.O2  / totalAfterMoles,
      CO2: afterMoles.CO2 / totalAfterMoles,
      CO:  afterMoles.CO  / totalAfterMoles,
      H2O: afterMoles.H2O / totalAfterMoles,
      H2:  afterMoles.H2  / totalAfterMoles,
    };

    const beforeFrac: GasMoleFractions = { N2: 1 - pO2, O2: pO2, CO2: 0, CO: 0, H2O: 0, H2: 0 };

    // ── Available heat ────────────────────────────────────────────────────────
    const Q_W = mCarbon_kgs * (
      kCO  * COMBUSTION.Q_CO_J_KG +
      kCO2 * COMBUSTION.Q_CARBON_J_KG +
      kH2  * COMBUSTION.Q_H2_J_KG
    ) - genLoss_W;

    // ── Iterative flame temperature ───────────────────────────────────────────
    const moleFracsForCp: Partial<Record<Species, number>> = {
      [Species.N2]:  afterFrac.N2,
      [Species.O2]:  afterFrac.O2,
      [Species.CO2]: afterFrac.CO2,
      [Species.CO]:  afterFrac.CO,
      [Species.H2O]: afterFrac.H2O,
      [Species.H2]:  afterFrac.H2,
    };
    const M_kg_mol = this.gasProps.molecularWeight(moleFracsForCp);

    let tFlame_K = tAirStart_K;
    for (let i = 0; i < COMBUSTION.MAX_FLAME_ITERATIONS; i++) {
      const cp_J_molK = this.gasProps.cpMixture(moleFracsForCp, tFlame_K, tAirStart_K);
      const cp_J_kgK  = cp_J_molK / M_kg_mol;
      const dT         = Q_W / (cp_J_kgK * mSmoke_kgs);
      const tNew       = tAirStart_K + dT;
      if (Math.abs(tNew - tFlame_K) < COMBUSTION.FLAME_CONVERGENCE_K) {
        tFlame_K = tNew;
        break;
      }
      tFlame_K = tNew;
    }

    const tSmokeStart_K = Math.min(
      tFlame_K / COMBUSTION.FLAME_TO_SMOKE_RATIO,
      COMBUSTION.T_SMOKE_START_MAX_K,
    );

    return {
      tFlame_K,
      tSmokeStart_K,
      mFuel_kgs,
      mAir_kgs,
      mSmoke_kgs,
      composition: { before: beforeFrac, after: afterFrac },
      pCO2: afterFrac.CO2,
      pH2O: afterFrac.H2O,
    };
  }
}
