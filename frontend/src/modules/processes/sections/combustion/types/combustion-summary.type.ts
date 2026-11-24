import type { BedLayerResult } from '../../../types/bed-layer-result.type';
import type { CombustionStepResult } from '../../../types/combustion-step-result.type';
import type { FuelSummary } from '../../../types/fuel-summary.type';
import type { SpeciesValues } from '../../../types/species-values.type';
import type { CombustionFlow } from './combustion-flow.type';

/** The four mode results reduced to what the result panel shows. */
export type CombustionSummary = {
  fuel: FuelSummary;
  mFuel_kgs: number;
  fPower_W: number;
  tFlame_K: number;
  tStep1_K?: number;
  /** Air, steam fed. */
  feeds: CombustionFlow[];
  steps: Array<{ key: string; label: string; result: CombustionStepResult }>;
  lastStep: CombustionStepResult;
  /** Mole fractions per stage, for the product composition chart. */
  compositions: Array<{ label: string; moleFractions: SpeciesValues }>;
  details: Array<{ label: string; value: number | null; unit?: string }>;
  layers?: BedLayerResult[];
};
