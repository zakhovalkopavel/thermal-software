import type { BlendOptimizationResult } from '../types';

/**
 * Constraint filters and optimization-score ranking for blend results.
 */
export class BlendOptimizerRanking {
  static applyConstraints(
    results: BlendOptimizationResult[],
    constraints: {
      minPackingEfficiency?: number;
      maxWaterDemand?: number;
      maxPorosity?: number;
    },
  ): BlendOptimizationResult[] {
    let filtered = results;

    if (constraints.minPackingEfficiency !== undefined) {
      filtered = filtered.filter(r => r.packingEfficiency >= constraints.minPackingEfficiency!);
    }

    if (constraints.maxWaterDemand !== undefined) {
      filtered = filtered.filter(r => r.waterDemand_percent <= constraints.maxWaterDemand!);
    }

    if (constraints.maxPorosity !== undefined) {
      filtered = filtered.filter(r => r.porosity_percent_green <= constraints.maxPorosity!);
    }

    return filtered;
  }

  static calculateScoresAndRank(
    results: BlendOptimizationResult[],
    goal: 'maxDensity' | 'minPorosity' | 'minWater' | 'minShrinkage' | 'balanced',
  ): BlendOptimizationResult[] {
    const scoredResults = results.map(result => {
      let score: number;
      const maxShrinkage = Math.max(...(result.shrinkage.total?.shrinkage_volumetric_percent || [0]));

      switch (goal) {
        case 'maxDensity':
          score = result.rhoBulk_gml_green;
          break;
        case 'minPorosity':
          score = 100 - result.porosity_percent_green;
          break;
        case 'minWater':
          score = 50 - result.waterDemand_percent;
          break;
        case 'minShrinkage':
          score = 100 - maxShrinkage;
          break;
        case 'balanced':
        default: {
          const densityScore = result.rhoBulk_gml_green / 3.5 * 100;
          const porosityScore = 100 - result.porosity_percent_green;
          const waterScore = (50 - result.waterDemand_percent) / 50 * 100;
          const shrinkageScore = 100 - maxShrinkage;
          score = (densityScore + porosityScore + waterScore + shrinkageScore) / 4;
          break;
        }
      }

      return {
        ...result,
        optimizationScore: Number(score.toFixed(2)),
      };
    });

    scoredResults.sort((a, b) => (b.optimizationScore || 0) - (a.optimizationScore || 0));

    return scoredResults.map((result, index) => ({
      ...result,
      rank: index + 1,
    }));
  }
}
