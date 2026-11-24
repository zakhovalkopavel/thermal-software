import { Injectable, Logger } from '@nestjs/common';
import { BLEND_OPTIMIZER_CONSTANTS } from '../../constants/blend-optimizer.constants';
import {
  BlendOptimizationRequest,
  BlendOptimizationResult,
} from '../../types';
import { BlendOptimizerRanking } from '../../utils/blend-optimizer-ranking';
import { BlendOptimizerEvaluateService } from './blend-optimizer-evaluate.service';
import { BlendOptimizerExpandService } from './blend-optimizer-expand.service';

/**
 * Blend Optimizer Service
 * Ported from: legacy/refractory/src/calculators/BlendOptimizer.ts (346 lines)
 *
 * Optimizes particle size distribution blends using multiple methods and scenarios.
 * Integrates PSD calculation, packing models, and shrinkage prediction for complete
 * refractory blend characterization.
 *
 * Evaluation / expand / ranking live in sibling services and {@link BlendOptimizerRanking}.
 */
@Injectable()
export class BlendOptimizerService {
  private readonly logger = new Logger(BlendOptimizerService.name);

  constructor(
    private readonly evaluateSvc: BlendOptimizerEvaluateService,
    private readonly expandSvc: BlendOptimizerExpandService,
  ) {}

  /**
   * Optimize particle size distribution blend
   *
   * @param request Blend optimization request with fractions and options
   * @returns Array of optimization results for all tested combinations
   */
  optimize(request: BlendOptimizationRequest): BlendOptimizationResult[] {
    const { fractions, options = {} } = request;
    const {
      qValues = [...BLEND_OPTIMIZER_CONSTANTS.DEFAULT_Q_VALUES],
      methods = [...BLEND_OPTIMIZER_CONSTANTS.PSD_METHODS] as any,
      packingModels = [...BLEND_OPTIMIZER_CONSTANTS.PACKING_MODELS] as any,
      scenarios = [...BLEND_OPTIMIZER_CONSTANTS.COMPACTION_SCENARIOS] as any,
      temperatureProfile_C = [...BLEND_OPTIMIZER_CONSTANTS.DEFAULT_TEMPERATURE_PROFILE_C],
      waterCementRatio = BLEND_OPTIMIZER_CONSTANTS.DEFAULT_WATER_CEMENT_RATIO,
      optimizationGoal = 'balanced',
      topN,
      minPackingEfficiency,
      maxWaterDemand,
      maxPorosity,
      autoExpandRanges = false,
      rangeSimilarityThreshold = 0.01,
    } = options;

    const results: BlendOptimizationResult[] = [];

    for (const method of methods) {
      for (const q of qValues) {
        for (const scenario of scenarios) {
          for (const packingModel of packingModels) {
            results.push(this.evaluateSvc.evaluate({
              fractions,
              method,
              q,
              scenario,
              packingModel,
              temperatureProfile_C,
              waterCementRatio,
            }));
          }
        }
      }
    }

    let filteredResults = BlendOptimizerRanking.applyConstraints(results, {
      minPackingEfficiency,
      maxWaterDemand,
      maxPorosity,
    });

    filteredResults = BlendOptimizerRanking.calculateScoresAndRank(
      filteredResults,
      optimizationGoal,
    );

    if (autoExpandRanges && filteredResults.length > 1) {
      const viableRanges = this.expandSvc.detectViableRanges(
        filteredResults,
        rangeSimilarityThreshold,
      );

      if (viableRanges.length > 0 && viableRanges[0].formulations.length > 1) {
        this.logger.log(`🎯 Viable range detected! Expanding search to map boundaries...`);

        const expandedResults = this.expandSvc.expandSearchAroundRange(
          request,
          viableRanges[0],
        );

        filteredResults = BlendOptimizerRanking.calculateScoresAndRank(
          [...filteredResults, ...expandedResults],
          optimizationGoal,
        );
      }
    }

    if (topN && topN > 0) {
      filteredResults = filteredResults.slice(0, topN);
    }

    this.logger.log(
      `Blend optimization complete: ${filteredResults.length} results (from ${results.length} total, goal: ${optimizationGoal})`,
    );
    return filteredResults;
  }
}
