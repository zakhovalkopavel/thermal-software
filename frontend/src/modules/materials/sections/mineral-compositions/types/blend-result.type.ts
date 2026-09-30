import type { ShrinkageResult } from './shrinkage-result.type';

export type BlendResult = {
  rank: number;
  method: string;
  q: number;
  scenario: string;
  packingModel: string;
  /** 0–1, in request order. */
  massFractions: number[];
  massFractionsRoundedPercent: number[];
  rhoSkeletal_gml: number;
  rhoBulk_gml_green: number;
  packingEfficiency: number;
  porosity_percent_green: number;
  waterDemand_percent: number;
  waterDemandRange: { min: number; typical: number; max: number };
  shrinkage: ShrinkageResult;
  optimizationScore: number;
};
