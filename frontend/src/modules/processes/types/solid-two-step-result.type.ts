import type { CombustionStepResult } from './combustion-step-result.type';
import type { FuelSummary } from './fuel-summary.type';

export type SolidTwoStepResult = {
  fuel: FuelSummary;
  mFuel_kgs: number;
  fPower_W: number;
  primaryExcessAir: number;
  mAirPrimary_kgs: number;
  mAirSecondary_kgs: number;
  tStep1_K: number;
  tFlame_K: number;
  generator: CombustionStepResult;
  burnout: CombustionStepResult;
};
