/** Blend optimization options. */
export type BlendOptimizationOptions = {
  /** q values for PSD optimization (distribution modulus) */
  qValues?: number[];

  /** PSD calculation methods to test */
  methods?: string[];

  /** Packing density models to use */
  packingModels?: string[];

  /** Compaction scenarios to evaluate */
  scenarios?: string[];

  /** Temperature profile for shrinkage calculation (°C) */
  temperatureProfile_C?: number[];

  /** Water-cement ratio for shrinkage calculation */
  waterCementRatio?: number;

  /** Cement content fraction */
  cementContent?: number;

  /** Optimization goal: what to optimize for */
  optimizationGoal?: 'maxDensity' | 'minPorosity' | 'minWater' | 'minShrinkage' | 'balanced';

  /** Return only top N results (default: all) */
  topN?: number;

  /** Minimum acceptable packing efficiency (0-1) */
  minPackingEfficiency?: number;

  /** Maximum acceptable water demand (%) */
  maxWaterDemand?: number;

  /** Maximum acceptable porosity (%) */
  maxPorosity?: number;

  /** Auto-expand search when viable ranges detected (default: false) */
  autoExpandRanges?: boolean;

  /**
   * Score similarity threshold for range detection (default: 0.01 = 1%)
   * Single number or per-component array matching fractions order.
   */
  rangeSimilarityThreshold?: number | number[];

  /**
   * Composition similarity threshold for grouping formulations (default: 2%)
   * Single number or per-component array matching fractions order.
   */
  compositionSimilarityThreshold?: number | number[];
};
