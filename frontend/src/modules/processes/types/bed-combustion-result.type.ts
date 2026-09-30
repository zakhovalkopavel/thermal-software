import type { BedLayerResult } from './bed-layer-result.type';
import type { CombustionStepResult } from './combustion-step-result.type';
import type { FuelSummary } from './fuel-summary.type';
import type { SpeciesValues } from './species-values.type';

export type BedCombustionResult = {
  fuel: FuelSummary;
  layers: BedLayerResult[];
  mFuel_kgs: number;
  fPower_W: number;
  carbonBurnRate_kgs: number;
  ash_kgs: number;
  mAirPrimary_kgs: number;
  mSteam_kgs: number;
  mAirSecondary_kgs: number;
  primaryExcessAir: number;
  generatorHeatLoss_W: number;
  pressureDrop_Pa: number;
  oxidationZoneHeight_m: number | null;
  tStep1_K: number;
  generatorGasMoleFlows_mols: SpeciesValues;
  generatorGasMoleFractions: SpeciesValues;
  mGeneratorGas_kgs: number;
  elementBalanceResidual: number;
  energyBalanceResidual_W: number;
  tFlame_K: number;
  burnout: CombustionStepResult;
};
