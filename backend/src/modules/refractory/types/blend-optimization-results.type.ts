import type { BlendOptimizationResult } from './blend-optimization-result.type';
import type { ViableCompositionRange } from './viable-composition-range.type';

/** Complete blend optimization results. */
export type BlendOptimizationResults = {
  /** Array of results for all tested combinations */
  results: BlendOptimizationResult[];

  /** Total number of combinations tested */
  combinationCount: number;

  /** Best result by packing efficiency */
  bestByPackingEfficiency?: BlendOptimizationResult;

  /** Best result by lowest porosity */
  bestByLowestPorosity?: BlendOptimizationResult;

  /** Best result by scenario (self-compacting) */
  bestByScenario?: Record<string, BlendOptimizationResult>;

  /** Viable composition ranges detected */
  viableRanges?: ViableCompositionRange[];

  /** Whether auto-expansion was performed */
  wasExpanded?: boolean;
};
