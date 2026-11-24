import type { ShrinkageResult } from './shrinkage-result.type';

/** Individual optimization result for one combination. */
export type BlendOptimizationResult = {
  /** PSD method used (Andreasen or Funk-Dinger) */
  method: string;

  /** Distribution modulus value */
  q: number;

  /** Compaction scenario */
  scenario: string;

  /** Packing density model used */
  packingModel: string;

  /** Calculated mass fractions */
  massFractions: number[];

  /** Rounded mass fractions in percent */
  massFractionsRoundedPercent: number[];

  /** Skeletal (particle) density (g/mL) */
  rhoSkeletal_gml: number;

  /** Green bulk density (g/mL) — before sintering */
  rhoBulk_gml_green: number;

  /** Packing efficiency (0-1) */
  packingEfficiency: number;

  /** Green porosity percentage */
  porosity_percent_green: number;

  /** Water demand for standard workability (%) */
  waterDemand_percent: number;

  /** Water demand range for different workability levels */
  waterDemandRange: {
    min: number;
    typical: number;
    max: number;
  };

  /** Shrinkage prediction results */
  shrinkage: ShrinkageResult;

  /** Optimization score (higher is better, based on optimization goal) */
  optimizationScore?: number;

  /** Rank among all results (1 = best) */
  rank?: number;
};
