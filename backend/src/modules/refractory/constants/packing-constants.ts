import { Beta0Model, MaxPhiModel } from '../enums/packing-models.enum';

/**
 * Packing Model Constants
 * Research-backed calibration values for CPM and Furnas models
 *
 * References:
 * - Johansen, V. & Andersen, P.J. (1991) "Particle packing and concrete properties"
 * - de Larrard, F. (1999) "Concrete Mixture Proportioning"
 * - Studart, A.R. et al. (2006) "Processing Routes to Macroporous Ceramics: A Review"
 * - Wong, H.H.C. & Kwan, A.K.H. (2008) "Packing density of cementitious materials"
 * - Pileggi, R.G. et al. (2001) "Novel rheometer for refractory castables"
 * - Fennis, S.A.A.M. (2011) "Design of ecological concrete by particle packing optimization"
 */

/**
 * β₀ values by particle shape
 * Source: Johansen & Andersen (1991), de Larrard (1999) Table 2.1
 */
export const BETA0_VALUES: Record<Beta0Model, number> = {
  [Beta0Model.SPHERICAL]: 0.64,     // RCP limit (glass beads, rounded aggregates)
  [Beta0Model.SUB_ANGULAR]: 0.60,   // Natural sand, crushed rounded
  [Beta0Model.ANGULAR]: 0.56,       // Crushed rock, typical refractory (DEFAULT)
  [Beta0Model.FLAKY]: 0.50,         // Mica, fibrous materials
};

/**
 * φ_max values by packing model
 * Source: Studart (2006), Wong & Kwan (2008), de Larrard (1999)
 */
export const MAX_PHI_VALUES: Record<MaxPhiModel, number> = {
  [MaxPhiModel.THEORETICAL_FCC]: 0.7405,      // FCC/HCP densest sphere packing
  [MaxPhiModel.TYPICAL_CONCRETE]: 0.72,       // Well-graded, no compaction
  [MaxPhiModel.DENSE_CASTABLE]: 0.76,         // Vibrated, optimized PSD (DEFAULT)
  [MaxPhiModel.HIGH_PERFORMANCE]: 0.80,       // Micro-fillers, high compaction
  [MaxPhiModel.LEGACY_CONSERVATIVE]: 0.85,    // Legacy project cap (above realistic)
};

/**
 * Default calibration constants
 */
export const PACKING_DEFAULTS = {
  /** Compaction coefficient K (de Larrard 1999) */
  CPM_K: 9.0,

  /** Furnas void filling efficiency */
  FURNAS_EFFICIENCY: 0.75,

  /**
   * Denominator stability floor (allows ~95% of P_crit)
   * Source: Fennis (2011), concrete software practice
   * Research range: 0.01–0.10
   */
  DENOM_FLOOR: 0.05,

  /** Reference pressure for compaction index calculation (MPa) */
  PRESSURE_REF_MPA: 10.0,

  /** Default β₀ model for refractories */
  DEFAULT_BETA0_MODEL: Beta0Model.ANGULAR,

  /** Default φ_max model for refractories */
  DEFAULT_MAX_PHI_MODEL: MaxPhiModel.DENSE_CASTABLE,
} as const;

/**
 * Composition analysis thresholds and limits
 * Used for adaptive φ_max selection based on mix characteristics
 *
 * References:
 * - Studart et al. (2006): Micro-filler impact on packing
 * - de Larrard (1999): PSD quality assessment
 * - Pileggi et al. (2001): Refractory castable classification
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
} as const;



