import type { CombustionStepResult } from './combustion-step-result.type';
import type { FuelSummary } from './fuel-summary.type';

/** Result of modes 1 (solid direct) and 3 (fluid). */
export type SingleStepCombustionResult = {
  fuel: FuelSummary;
  mFuel_kgs: number;
  fPower_W: number;
  mAir_kgs: number;
  tFlame_K: number;
  combustion: CombustionStepResult;
};
