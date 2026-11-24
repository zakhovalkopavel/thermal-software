import { BlendOptimizerRanking } from '../../../../src/modules/refractory/utils/blend-optimizer-ranking';
import type { BlendOptimizationResult } from '../../../../src/modules/refractory/types';

function result(partial: Partial<BlendOptimizationResult>): BlendOptimizationResult {
  return {
    method: 'Andreasen',
    q: 0.25,
    scenario: 'Vibratable',
    packingModel: 'CPM',
    massFractions: [0.5, 0.5],
    massFractionsRoundedPercent: [50, 50],
    rhoSkeletal_gml: 3.2,
    rhoBulk_gml_green: 2.5,
    packingEfficiency: 0.78,
    porosity_percent_green: 22,
    waterDemand_percent: 12,
    waterDemandRange: { min: 10, typical: 12, max: 15 },
    shrinkage: {
      drying: { shrinkage_volumetric_percent: [1] } as any,
      firing: [],
      total: { shrinkage_volumetric_percent: [2] } as any,
      metadata: {},
      warnings: [],
    } as any,
    ...partial,
  };
}

describe('BlendOptimizerRanking', () => {
  describe('applyConstraints', () => {
    const pool = [
      result({ packingEfficiency: 0.85, waterDemand_percent: 10, porosity_percent_green: 15 }),
      result({ packingEfficiency: 0.70, waterDemand_percent: 18, porosity_percent_green: 25 }),
      result({ packingEfficiency: 0.90, waterDemand_percent: 8, porosity_percent_green: 12 }),
    ];

    it('returns all results when no constraints are set', () => {
      expect(BlendOptimizerRanking.applyConstraints(pool, {})).toHaveLength(3);
    });

    it('filters by minPackingEfficiency', () => {
      const filtered = BlendOptimizerRanking.applyConstraints(pool, {
        minPackingEfficiency: 0.8,
      });
      expect(filtered).toHaveLength(2);
      expect(filtered.every((r) => r.packingEfficiency >= 0.8)).toBe(true);
    });

    it('filters by maxWaterDemand', () => {
      const filtered = BlendOptimizerRanking.applyConstraints(pool, {
        maxWaterDemand: 12,
      });
      expect(filtered).toHaveLength(2);
      expect(filtered.every((r) => r.waterDemand_percent <= 12)).toBe(true);
    });

    it('filters by maxPorosity', () => {
      const filtered = BlendOptimizerRanking.applyConstraints(pool, {
        maxPorosity: 20,
      });
      expect(filtered).toHaveLength(2);
      expect(filtered.every((r) => r.porosity_percent_green <= 20)).toBe(true);
    });

    it('applies combined constraints', () => {
      const filtered = BlendOptimizerRanking.applyConstraints(pool, {
        minPackingEfficiency: 0.8,
        maxWaterDemand: 12,
        maxPorosity: 20,
      });
      expect(filtered).toHaveLength(2);
    });
  });

  describe('calculateScoresAndRank', () => {
    const pool = [
      result({
        rhoBulk_gml_green: 2.8,
        porosity_percent_green: 18,
        waterDemand_percent: 14,
        shrinkage: {
          total: { shrinkage_volumetric_percent: [3] },
        } as any,
      }),
      result({
        rhoBulk_gml_green: 3.1,
        porosity_percent_green: 12,
        waterDemand_percent: 9,
        shrinkage: {
          total: { shrinkage_volumetric_percent: [1] },
        } as any,
      }),
    ];

    it('ranks densest first for maxDensity', () => {
      const ranked = BlendOptimizerRanking.calculateScoresAndRank(pool, 'maxDensity');
      expect(ranked[0].rank).toBe(1);
      expect(ranked[0].rhoBulk_gml_green).toBe(3.1);
      expect(ranked[0].optimizationScore).toBe(3.1);
      expect(ranked[1].rank).toBe(2);
    });

    it('ranks lowest porosity first for minPorosity', () => {
      const ranked = BlendOptimizerRanking.calculateScoresAndRank(pool, 'minPorosity');
      expect(ranked[0].porosity_percent_green).toBe(12);
      expect(ranked[0].optimizationScore).toBe(88);
    });

    it('ranks lowest water demand first for minWater', () => {
      const ranked = BlendOptimizerRanking.calculateScoresAndRank(pool, 'minWater');
      expect(ranked[0].waterDemand_percent).toBe(9);
      expect(ranked[0].optimizationScore).toBe(41);
    });

    it('ranks lowest shrinkage first for minShrinkage', () => {
      const ranked = BlendOptimizerRanking.calculateScoresAndRank(pool, 'minShrinkage');
      expect(ranked[0].optimizationScore).toBe(99);
      expect(ranked[1].optimizationScore).toBe(97);
    });

    it('assigns balanced scores and contiguous ranks', () => {
      const ranked = BlendOptimizerRanking.calculateScoresAndRank(pool, 'balanced');
      expect(ranked).toHaveLength(2);
      expect(ranked.map((r) => r.rank)).toEqual([1, 2]);
      expect(ranked[0].optimizationScore!).toBeGreaterThanOrEqual(ranked[1].optimizationScore!);
    });

    it('treats missing shrinkage totals as zero', () => {
      const ranked = BlendOptimizerRanking.calculateScoresAndRank(
        [result({ shrinkage: { total: undefined } as any })],
        'minShrinkage',
      );
      expect(ranked[0].optimizationScore).toBe(100);
    });
  });
});
