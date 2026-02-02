/**
 * Blend Optimizer Interfaces
 *
 * Internal type definitions for blend optimizer service
 * Separate from DTOs to allow service-level flexibility
 *
 * Date: February 2, 2026
 */

import { ShrinkageResult } from './shrinkage-calculator.interface';

// ============================================================
// FRACTION INTERFACES
// ============================================================

/**
 * Particle size fraction with material properties
 */
export interface Fraction {
  /** Optional material identifier for traceability */
  materialId?: string;

  /** Minimum particle size (mm) */
  dMin_mm: number;

  /** Maximum particle size (mm) */
  dMax_mm: number;

  /** Whether fraction size is fixed or can be adjusted */
  isFixed?: boolean;

  /** Mass fraction in blend (0-1) */
  massFraction?: number;

  /** Material density (kg/m³) - defaults to 2700 if not provided */
  density_kgm3?: number;
}

// ============================================================
// OPTIONS INTERFACES
// ============================================================

/**
 * Blend optimization options
 */
export interface BlendOptimizationOptions {
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
   * Can be:
   * - Single number: same threshold for all components (e.g., 0.01 = 1%)
   * - Array: per-component thresholds matching fractions order
   *   Example: [0.005, 0.01, 0.03] = [0.5% for cement, 1% for fine, 3% for coarse]
   */
  rangeSimilarityThreshold?: number | number[];

  /**
   * Composition similarity threshold for grouping formulations (default: 2%)
   * Formulations within this % difference in each component are considered "same range"
   * Can be:
   * - Single number: same tolerance for all components (e.g., 2 = ±2%)
   * - Array: per-component tolerances matching fractions order
   *   Example: [1, 2, 5] = [±1% cement, ±2% fine, ±5% coarse]
   */
  compositionSimilarityThreshold?: number | number[];
}

// ============================================================
// REQUEST INTERFACES
// ============================================================

/**
 * Complete blend optimization request
 */
export interface BlendOptimizationRequest {
  /** Array of particle size fractions */
  fractions: Fraction[];

  /** Optional optimization parameters */
  options?: BlendOptimizationOptions;
}

// ============================================================
// RESULT INTERFACES
// ============================================================

/**
 * Individual optimization result for one combination
 */
export interface BlendOptimizationResult {
  /** PSD method used (Andreasen or Funk-Dinger) */
  method: string;

  /** Distribution modulus value */
  q: number;

  /** Compaction scenario */
  scenario: string;

  /** Packing density model used */
  packingModel: string;

  /** Calculated mass fractions */
  massFractions: number[];

  /** Rounded mass fractions in percent */
  massFractionsRoundedPercent: number[];

  /** Skeletal (particle) density (g/mL) */
  rhoSkeletal_gml: number;

  /** Green bulk density (g/mL) - before sintering */
  rhoBulk_gml_green: number;

  /** Packing efficiency (0-1) */
  packingEfficiency: number;

  /** Green porosity percentage */
  porosity_percent_green: number;

  /** Water demand for standard workability (%) */
  waterDemand_percent: number;

  /** Water demand range for different workability levels */
  waterDemandRange: {
    min: number;
    typical: number;
    max: number;
  };

  /** Shrinkage prediction results */
  shrinkage: ShrinkageResult;

  /** Optimization score (higher is better, based on optimization goal) */
  optimizationScore?: number;

  /** Rank among all results (1 = best) */
  rank?: number;
}

/**
 * Viable composition range for a group of similar formulations
 */
export interface ViableCompositionRange {
  /** Average optimization score for this range */
  score: number;

  /** Number of formulations in this range */
  count: number;

  /** Formulations in this range */
  formulations: BlendOptimizationResult[];

  /** Composition ranges for each component */
  componentRanges: Array<{
    /** Component index */
    index: number;

    /** Component material ID if available */
    materialId?: string;

    /** Minimum mass fraction (%) */
    min: number;

    /** Maximum mass fraction (%) */
    max: number;

    /** Average mass fraction (%) */
    avg: number;

    /** Standard deviation (%) */
    stdDev: number;

    /** Tolerance applied for this component (%) */
    tolerance: number;

    /** Human-readable format: "avg±tolerance%" (e.g., "15±1%") */
    formatted: string;
  }>;

  /** Property ranges for this composition range */
  propertyRanges: {
    density: { min: number; max: number; avg: number };
    porosity: { min: number; max: number; avg: number };
    waterDemand: { min: number; max: number; avg: number };
    packingEfficiency: { min: number; max: number; avg: number };
  };

  /**
   * Summary of viable composition in human-readable format
   * Example: "[15±1% cement, 40±2% fine, 45±5% coarse] is optimal"
   */
  summary: string;
}

/**
 * Complete blend optimization results
 */
export interface BlendOptimizationResults {
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
}

// ============================================================
// INTERMEDIATE CALCULATION INTERFACES
// ============================================================

/**
 * PSD calculation result
 */
export interface PSDResult {
  /** Method used for PSD calculation */
  method: string;

  /** Mass fractions calculated */
  massFractions: number[];

  /** Rounded mass fractions in percent */
  massFractionsRoundedPercent: number[];

  /** Distribution modulus */
  q: number;
}

/**
 * Packing calculation result
 */
export interface PackingResult {
  /** Packing fraction (0-1) */
  packingFraction_phi: number;

  /** Packing model used */
  model: string;

  /** Compaction parameters applied */
  compactionParameters?: {
    pressure_MPa: number;
    index: number;
  };
}

// ============================================================
// VALIDATION INTERFACES
// ============================================================

/**
 * Validation result for blend optimization input
 */
export interface ValidationResult {
  /** Whether input is valid */
  isValid: boolean;

  /** Validation errors if any */
  errors: ValidationError[];

  /** Validation warnings if any */
  warnings: ValidationWarning[];
}

/**
 * Single validation error
 */
export interface ValidationError {
  /** Error field */
  field: string;

  /** Error message */
  message: string;

  /** Error code */
  code: 'INVALID_RANGE' | 'INVALID_TYPE' | 'MISSING_REQUIRED' | 'INVALID_SCENARIO' | 'OTHER';
}

/**
 * Single validation warning
 */
export interface ValidationWarning {
  /** Warning field */
  field: string;

  /** Warning message */
  message: string;

  /** Suggested action */
  suggestion?: string;
}

// ============================================================
// TYPE GUARDS
// ============================================================

/**
 * Type guard for Fraction
 */
export function isFraction(obj: any): obj is Fraction {
  return (
    typeof obj === 'object' &&
    typeof obj.dMin_mm === 'number' &&
    typeof obj.dMax_mm === 'number'
  );
}

/**
 * Type guard for BlendOptimizationOptions
 */
export function isBlendOptimizationOptions(obj: any): obj is BlendOptimizationOptions {
  return (
    typeof obj === 'object' &&
    (obj.qValues === undefined || Array.isArray(obj.qValues)) &&
    (obj.methods === undefined || Array.isArray(obj.methods)) &&
    (obj.packingModels === undefined || Array.isArray(obj.packingModels)) &&
    (obj.scenarios === undefined || Array.isArray(obj.scenarios))
  );
}

/**
 * Type guard for BlendOptimizationRequest
 */
export function isBlendOptimizationRequest(obj: any): obj is BlendOptimizationRequest {
  return (
    typeof obj === 'object' &&
    Array.isArray(obj.fractions) &&
    obj.fractions.every(isFraction) &&
    (obj.options === undefined || isBlendOptimizationOptions(obj.options))
  );
}
