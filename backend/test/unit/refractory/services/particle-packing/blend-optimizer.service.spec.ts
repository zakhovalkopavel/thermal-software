import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { BlendOptimizerService } from '../../../../../src/modules/refractory/services/particle-packing/blend-optimizer.service';
import { BlendOptimizerEvaluateService } from '../../../../../src/modules/refractory/services/particle-packing/blend-optimizer-evaluate.service';
import { BlendOptimizerExpandService } from '../../../../../src/modules/refractory/services/particle-packing/blend-optimizer-expand.service';
import type {
  BlendOptimizationRequest,
  BlendOptimizationResult,
  Fraction,
} from '../../../../../src/modules/refractory/types';

function fraction(overrides: Partial<Fraction> = {}): Fraction {
  return {
    materialId: 'mat_a',
    dMin_mm: 0.045,
    dMax_mm: 0.09,
    density_kgm3: 3200,
    ...overrides,
  };
}

function evaluated(partial: Partial<BlendOptimizationResult>): BlendOptimizationResult {
  return {
    method: 'Andreasen',
    q: 0.25,
    scenario: 'Vibratable',
    packingModel: 'CPM',
    massFractions: [0.4, 0.6],
    massFractionsRoundedPercent: [40, 60],
    rhoSkeletal_gml: 3.2,
    rhoBulk_gml_green: 2.6,
    packingEfficiency: 0.8,
    porosity_percent_green: 20,
    waterDemand_percent: 12,
    waterDemandRange: { min: 10, typical: 12, max: 14 },
    shrinkage: {
      drying: {},
      firing: [],
      total: { shrinkage_volumetric_percent: [2] },
      metadata: {},
      warnings: [],
    } as any,
    ...partial,
  };
}

describe('BlendOptimizerService', () => {
  let service: BlendOptimizerService;
  let evaluateSvc: { evaluate: jest.Mock };
  let expandSvc: {
    detectViableRanges: jest.Mock;
    expandSearchAroundRange: jest.Mock;
  };

  const baseFractions: Fraction[] = [
    fraction({ materialId: 'fine', dMin_mm: 0.001, dMax_mm: 0.1 }),
    fraction({ materialId: 'coarse', dMin_mm: 1, dMax_mm: 3 }),
  ];

  beforeEach(async () => {
    evaluateSvc = {
      evaluate: jest.fn(({ method, q, scenario, packingModel }) =>
        evaluated({
          method,
          q,
          scenario,
          packingModel,
          packingEfficiency: packingModel === 'CPM' ? 0.85 : 0.7,
          waterDemand_percent: packingModel === 'CPM' ? 10 : 18,
          porosity_percent_green: packingModel === 'CPM' ? 15 : 28,
          rhoBulk_gml_green: packingModel === 'CPM' ? 2.9 : 2.3,
        }),
      ),
    };
    expandSvc = {
      detectViableRanges: jest.fn().mockReturnValue([]),
      expandSearchAroundRange: jest.fn().mockReturnValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlendOptimizerService,
        { provide: BlendOptimizerEvaluateService, useValue: evaluateSvc },
        { provide: BlendOptimizerExpandService, useValue: expandSvc },
      ],
    }).compile();

    service = module.get(BlendOptimizerService);
  });

  function optimizeNarrow(
    options: BlendOptimizationRequest['options'] = {},
  ): BlendOptimizationResult[] {
    return service.optimize({
      fractions: baseFractions,
      options: {
        methods: ['Andreasen'],
        qValues: [0.25],
        scenarios: ['Vibratable'],
        packingModels: ['CPM', 'Furnas'],
        ...options,
      },
    });
  }

  describe('optimize — happy path', () => {
    it('evaluates every method × q × scenario × packingModel combination', () => {
      const results = service.optimize({
        fractions: baseFractions,
        options: {
          methods: ['Andreasen', 'FunkDinger'],
          qValues: [0.25, 0.30],
          scenarios: ['Vibratable'],
          packingModels: ['CPM'],
        },
      });

      expect(evaluateSvc.evaluate).toHaveBeenCalledTimes(4);
      expect(results).toHaveLength(4);
      expect(results[0]).toEqual(
        expect.objectContaining({
          method: expect.any(String),
          q: expect.any(Number),
          packingModel: 'CPM',
          packingEfficiency: expect.any(Number),
          shrinkage: expect.any(Object),
          rank: 1,
          optimizationScore: expect.any(Number),
        }),
      );
    });

    it('uses default option grids when options are omitted', () => {
      service.optimize({ fractions: baseFractions });
      // 2 methods × 4 q × 4 scenarios × 2 packing models
      expect(evaluateSvc.evaluate).toHaveBeenCalledTimes(64);
    });

    it('passes temperature profile and water-cement ratio into evaluate', () => {
      optimizeNarrow({
        temperatureProfile_C: [700, 1100],
        waterCementRatio: 0.4,
      });

      expect(evaluateSvc.evaluate).toHaveBeenCalledWith(
        expect.objectContaining({
          fractions: baseFractions,
          temperatureProfile_C: [700, 1100],
          waterCementRatio: 0.4,
        }),
      );
    });
  });

  describe('optimize — constraints and ranking', () => {
    it('filters by packing / water / porosity constraints', () => {
      const results = optimizeNarrow({
        minPackingEfficiency: 0.8,
        maxWaterDemand: 12,
        maxPorosity: 20,
      });

      expect(results).toHaveLength(1);
      expect(results[0].packingModel).toBe('CPM');
      expect(results[0].rank).toBe(1);
    });

    it('returns an empty array when every candidate fails constraints', () => {
      const results = optimizeNarrow({ minPackingEfficiency: 0.99 });
      expect(results).toEqual([]);
    });

    it('ranks by maxDensity goal', () => {
      const results = optimizeNarrow({ optimizationGoal: 'maxDensity' });
      expect(results[0].rhoBulk_gml_green).toBeGreaterThanOrEqual(
        results[1].rhoBulk_gml_green,
      );
      expect(results.map((r) => r.rank)).toEqual([1, 2]);
    });

    it('limits output with topN', () => {
      const results = optimizeNarrow({ topN: 1 });
      expect(results).toHaveLength(1);
      expect(results[0].rank).toBe(1);
    });

    it('ignores non-positive topN', () => {
      const results = optimizeNarrow({ topN: 0 });
      expect(results).toHaveLength(2);
    });
  });

  describe('optimize — autoExpandRanges', () => {
    it('merges expanded evaluations when a multi-formulation viable range exists', () => {
      const seedA = evaluated({
        method: 'Andreasen',
        q: 0.25,
        packingModel: 'CPM',
        optimizationScore: 80,
      });
      const seedB = evaluated({
        method: 'Andreasen',
        q: 0.25,
        packingModel: 'Furnas',
        optimizationScore: 79,
      });
      expandSvc.detectViableRanges.mockReturnValue([
        { score: 80, formulations: [seedA, seedB] },
      ]);
      expandSvc.expandSearchAroundRange.mockReturnValue([
        evaluated({
          method: 'Andreasen',
          q: 0.26,
          packingModel: 'CPM',
          rhoBulk_gml_green: 3.0,
          packingEfficiency: 0.9,
          waterDemand_percent: 9,
          porosity_percent_green: 10,
        }),
      ]);

      const results = optimizeNarrow({ autoExpandRanges: true });

      expect(expandSvc.detectViableRanges).toHaveBeenCalled();
      expect(expandSvc.expandSearchAroundRange).toHaveBeenCalled();
      expect(results.length).toBeGreaterThanOrEqual(3);
      expect(results[0].rank).toBe(1);
    });

    it('skips expansion when no multi-formulation range is found', () => {
      expandSvc.detectViableRanges.mockReturnValue([
        { score: 80, formulations: [evaluated({})] },
      ]);

      optimizeNarrow({ autoExpandRanges: true });
      expect(expandSvc.expandSearchAroundRange).not.toHaveBeenCalled();
    });
  });

  describe('optimize — errors', () => {
    it('propagates evaluate failures', () => {
      evaluateSvc.evaluate.mockImplementation(() => {
        throw new BadRequestException('invalid q');
      });

      expect(() => optimizeNarrow()).toThrow(BadRequestException);
    });
  });

  describe('optimize — fixed fractions passthrough', () => {
    it('forwards fixed-fraction metadata to evaluate unchanged', () => {
      const fractions: Fraction[] = [
        fraction({
          materialId: 'fondu',
          isFixed: true,
          massFraction: 0.15,
        }),
        fraction({ materialId: 'chamotte', isFixed: false }),
      ];

      service.optimize({
        fractions,
        options: {
          methods: ['Andreasen'],
          qValues: [0.27],
          scenarios: ['Hand-pressable'],
          packingModels: ['Furnas'],
        },
      });

      expect(evaluateSvc.evaluate).toHaveBeenCalledWith(
        expect.objectContaining({
          fractions,
          method: 'Andreasen',
          q: 0.27,
          scenario: 'Hand-pressable',
          packingModel: 'Furnas',
        }),
      );
    });
  });
});
