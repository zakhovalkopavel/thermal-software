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
