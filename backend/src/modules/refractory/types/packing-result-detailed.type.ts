import type { PackingResult } from './packing-result.type';

/** Detailed packing calculation result with intermediate values. */
export type PackingResultDetailed = PackingResult & {
  /** Virtual packing values for each size class */
  virtualPacking?: number[];

  /** Volume fractions (converted from mass fractions) */
  volumeFractions?: number[];

  /** Compaction index applied (CPM only) */
  compactionIndex?: number;

  /** Void filling efficiency applied (Furnas only) */
  adjustedEfficiency?: number[];
};
