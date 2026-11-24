import type { BlendResult } from '../../../src/modules/materials/sections/mineral-compositions/types/blend-result.type';
import { SHRINKAGE_RESULT } from './shrinkage-result';

/** An optimiser result for the five castable fractions; override what the test compares. */
export function blendResult(overrides: Partial<BlendResult> = {}): BlendResult {
  return {
    rank: 1,
    method: 'Andreasen',
    q: 0.25,
    scenario: 'Vibratable',
    packingModel: 'CPM',
    massFractions: [0.36, 0.24, 0.2, 0.15, 0.05],
    massFractionsRoundedPercent: [36, 24, 20, 15, 5],
    rhoSkeletal_gml: 3.55,
    rhoBulk_gml_green: 2.91,
    packingEfficiency: 0.82,
    porosity_percent_green: 18,
    waterDemand_percent: 5.2,
    waterDemandRange: { min: 4.5, typical: 5.2, max: 6 },
    shrinkage: SHRINKAGE_RESULT,
    optimizationScore: 0.91,
    ...overrides,
  };
}
