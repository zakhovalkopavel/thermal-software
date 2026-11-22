import { Injectable, Logger } from '@nestjs/common';
import { BLEND_OPTIMIZER_CONSTANTS } from '../../constants/blend-optimizer.constants';
import type { BlendOptimizationRequest, BlendOptimizationResult } from '../../types';
import { BlendOptimizerEvaluateService } from './blend-optimizer-evaluate.service';

/**
 * Viable-range detection and q-value expansion around the best scoring cluster.
 */
@Injectable()
export class BlendOptimizerExpandService {
  private readonly logger = new Logger(BlendOptimizerExpandService.name);

  constructor(private readonly evaluateSvc: BlendOptimizerEvaluateService) {}

  detectViableRanges(
    results: BlendOptimizationResult[],
    _threshold: number | number[],
  ): Array<{ score: number; formulations: BlendOptimizationResult[] }> {
    const ranges: Array<{ score: number; formulations: BlendOptimizationResult[] }> = [];
    const scoreThreshold = results.length > 0 ? (results[0].optimizationScore || 0) * 0.01 : 0.01;

    results.forEach(result => {
      const existingRange = ranges.find(r =>
        Math.abs(r.score - (result.optimizationScore || 0)) < scoreThreshold,
      );

      if (existingRange) {
        existingRange.formulations.push(result);
      } else {
        ranges.push({
          score: result.optimizationScore || 0,
          formulations: [result],
        });
      }
    });

    ranges.sort((a, b) => b.score - a.score);
    return ranges;
  }

  expandSearchAroundRange(
    request: BlendOptimizationRequest,
    range: { score: number; formulations: BlendOptimizationResult[] },
  ): BlendOptimizationResult[] {
    const { fractions } = request;
    const qValuesInRange = [...new Set(range.formulations.map(f => f.q))];

    const expandedQValues: number[] = [];
    qValuesInRange.forEach(q => {
      expandedQValues.push(q - 0.01, q + 0.01, q - 0.02, q + 0.02);
    });

    const uniqueQValues = [...new Set(expandedQValues)]
      .filter(q => q >= 0.20 && q <= 0.40)
      .sort((a, b) => a - b);

    this.logger.log(
      `Expanding with ${uniqueQValues.length} additional q values: [${uniqueQValues.map(q => q.toFixed(2)).join(', ')}]`,
    );

    const bestInRange = range.formulations[0];
    const temperatureProfile_C = request.options?.temperatureProfile_C
      || [...BLEND_OPTIMIZER_CONSTANTS.DEFAULT_TEMPERATURE_PROFILE_C];
    const waterCementRatio = request.options?.waterCementRatio
      || BLEND_OPTIMIZER_CONSTANTS.DEFAULT_WATER_CEMENT_RATIO;

    const expandedResults: BlendOptimizationResult[] = [];
    for (const q of uniqueQValues) {
      expandedResults.push(this.evaluateSvc.evaluate({
        fractions,
        method: bestInRange.method,
        q,
        scenario: bestInRange.scenario,
        packingModel: bestInRange.packingModel,
        temperatureProfile_C,
        waterCementRatio,
      }));
    }

    return expandedResults;
  }
}
