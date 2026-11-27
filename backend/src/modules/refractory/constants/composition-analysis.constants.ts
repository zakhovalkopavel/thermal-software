/**
 * Composition analysis thresholds and limits for adaptive φ_max selection.
 */
export const COMPOSITION_ANALYSIS_CONSTANTS = {
  /** Micro-filler size threshold (mm) - particles smaller than this */
  MICRO_FILLER_THRESHOLD_MM: 0.1,

  /** Minimum micro-filler percentage to be considered "significant" */
  MICRO_FILLER_SIGNIFICANT_PERCENT: 5.0,

  /** φ_max thresholds by micro-filler content (%) */
  MICRO_FILLER_THRESHOLDS: {
    /** Very high micro-filler (> 20%) */
    HIGH: {
      percent: 20,
      maxPhi: 0.82,
      confidence: 0.80,
    },
    /** Significant micro-filler (10-20%) */
    SIGNIFICANT: {
      percent: 10,
      maxPhi: 0.80,
      confidence: 0.85,
    },
    /** Some micro-filler (5-10%) */
    SOME: {
      percent: 5,
      maxPhi: 0.78,
      confidence: 0.80,
    },
  } as const,

  /** PSD quality thresholds based on size ratio and distribution variance */
  PSD_QUALITY_THRESHOLDS: {
    /** Poor PSD: similar sizes or very uneven distribution */
    POOR: {
      maxSizeRatio: 2.0,
      maxVariance: 0.3,
      maxPhi: 0.68,
      confidence: 0.85,
    },
    /** Fair PSD: some size variation, reasonable distribution */
    FAIR: {
      maxSizeRatio: 5.0,
      maxVariance: 0.2,
      maxPhi: 0.72,
      confidence: 0.88,
    },
    /** Good PSD: good size distribution */
    GOOD: {
      maxSizeRatio: 50.0,
      maxVariance: Infinity,
      maxPhi: 0.76,
      confidence: 0.90,
    },
    /** Excellent PSD: wide size range with good distribution */
    EXCELLENT: {
      maxSizeRatio: Infinity,
      maxVariance: Infinity,
      maxPhi: 0.78,
      confidence: 0.88,
    },
  } as const,

  /** φ_max adjustments for combinations of micro-fillers + PSD quality */
  COMBINATION_ADJUSTMENTS: {
    /** No fillers: use PSD quality limit directly */
    noFillers: {
      excellent: 0.78,
      good: 0.76,
      fair: 0.72,
      poor: 0.68,
    },
    /** With some fillers: increase by one quality level */
    someFillers: {
      excellent: 0.80,
      good: 0.78,
      fair: 0.76,
      poor: 0.72,
    },
    /** Significant fillers: allow high-performance range */
    significantFillers: {
      excellent: 0.82,
      good: 0.80,
      fair: 0.78,
      poor: 0.76,
    },
  } as const,

  /** Default φ_max when no clear pattern detected */
  DEFAULT_MAX_PHI: 0.76,
  DEFAULT_CONFIDENCE: 0.75,

  /**
   * Virtual-packing β₀ bonus when micro-fillers fill aggregate voids
   * (Studart 2006; Wong & Kwan 2008). Added on top of the resolved β₀ model
   * unless the caller set an explicit `beta0` override.
   */
  MICRO_FILLER_BETA_BONUS: {
    HIGH: 0.12,
    SIGNIFICANT: 0.08,
    SOME: 0.04,
  } as const,

  /** Cap on β₀ after micro-filler bonus (below dense random sphere packing) */
  MICRO_FILLER_BETA_CAP: 0.70,
} as const;
