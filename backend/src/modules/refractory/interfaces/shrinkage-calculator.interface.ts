/**
 * Shrinkage Calculator Interfaces
 *
 * Type definitions for shrinkage prediction during drying and firing
 * Implements chemical shrinkage and sintering shrinkage models
 *
 * References:
 * - Powers & Brownyard (1946): Studies of Physical Properties of Hardened Portland Cement Paste
 * - Su & Johnson (1996): Master Sintering Curve
 * - Coble (1961): Sintering Crystalline Solids
 *
 * Date: February 2, 2026
 */

// ============================================================
// MATERIAL INTERFACES
// ============================================================

/**
 * Material definition for shrinkage calculation
 */
export interface ShrinkageMaterial {
  /** Optional material identifier */
  id?: string;

  /** Material name */
  name: string;

  /** Activation energy for sintering (J/mol) */
  activationEnergy_Jmol?: number;

  /** Prefactor for sintering kinetics */
  prefactor?: number;

  /** Target relative density for sintering (0-1) */
  targetDensity?: number;
}

/**
 * Cement types for chemical shrinkage calculation
 */
export type CementType = 'PC' | 'CAC' | 'gypsum' | 'generic';

// ============================================================
// INPUT INTERFACES
// ============================================================

/**
 * Complete shrinkage prediction input
 */
export interface ShrinkageInput {
  /** Array of materials in the mix */
  materials: ShrinkageMaterial[];

  /** Mass fractions of each material (must sum to 1) */
  massFractions: number[];

  /** Temperature profile for evaluation (°C) */
  temperatureProfile_C: number[];

  /** Water-to-cement ratio (typical: 0.25-0.45) */
  waterCementRatio?: number;

  /** Mass fraction of cement in mix (0-1) */
  cementContent?: number;

  /** Cement type for chemical shrinkage model */
  cementType?: CementType;

  /** Initial green density (kg/m³) */
  greenDensity_kgm3?: number;

  /** Theoretical density (kg/m³) */
  theoreticalDensity_kgm3?: number;
}

// ============================================================
// STAGE RESULT INTERFACES
// ============================================================

/**
 * Single shrinkage stage result
 */
export interface ShrinkageStage {
  /** Stage name (drying, firing, total) */
  name: string;

  /** Temperature points for this stage (°C) */
  temperatures_C: number[];

  /** Volumetric shrinkage at each temperature (%) */
  shrinkage_volumetric_percent: number[];

  /** Linear shrinkage at each temperature (%) */
  shrinkage_linear_percent: number[];

  /** Relative density at each temperature (0-1) */
  relativeDensity: number[];

  /** Stage description */
  description: string;
}

/**
 * Drying stage specific result
 */
export interface DryingShrinkage extends ShrinkageStage {
  name: 'drying';

  /** Water content removed (%) */
  waterRemoved_percent: number;

  /** Chemical shrinkage coefficient */
  chemicalShrinkageCoefficient: number;
}

/**
 * Firing stage specific result
 */
export interface FiringShrinkage extends ShrinkageStage {
  name: 'firing';

  /** Sintering temperature (°C) */
  sinteringTemperature_C: number;

  /** Average sintering rate */
  sinteringRate: number;

  /** Master sintering curve parameter */
  masterSinteringCurve_theta: number;
}

// ============================================================
// COMPLETE RESULT INTERFACES
// ============================================================

/**
 * Complete shrinkage prediction result
 */
export interface ShrinkageResult {
  /** Drying stage results */
  drying: DryingShrinkage;

  /** Firing stage results (one entry per temperature) */
  firing: FiringShrinkage[];

  /** Total shrinkage summary */
  total: ShrinkageStage;

  /** Metadata about the calculation */
  metadata: ShrinkageMetadata;

  /** Any warnings or notes about calculation */
  warnings: string[];
}

/**
 * Metadata for shrinkage calculation
 */
export interface ShrinkageMetadata {
  /** Calculation timestamp */
  calculatedAt: Date;

  /** Total mix density (kg/m³) */
  mixDensity_kgm3: number;

  /** Theoretical density (kg/m³) */
  theoreticalDensity_kgm3: number;

  /** Initial green porosity (%) */
  greenPorosity_percent: number;

  /** Final porosity after firing (%) */
  finalPorosity_percent: number;

  /** Maximum shrinkage value (%) */
  maxShrinkage_volumetric_percent: number;

  /** Temperature at maximum shrinkage (°C) */
  tempAtMaxShrinkage_C: number;

  /** Calculation method used */
  method: 'master-sintering-curve' | 'chemical-based';

  /** Model parameters used */
  parameters: {
    waterCementRatio: number;
    cementContent: number;
    cementType: CementType;
  };
}

// ============================================================
// VALIDATION INTERFACES
// ============================================================

/**
 * Validation result for shrinkage input
 */
export interface ShrinkageValidationResult {
  /** Whether input is valid */
  isValid: boolean;

  /** Validation errors if any */
  errors: ShrinkageValidationError[];

  /** Validation warnings if any */
  warnings: ShrinkageValidationWarning[];
}

/**
 * Single validation error
 */
export interface ShrinkageValidationError {
  /** Error field */
  field: string;

  /** Error message */
  message: string;

  /** Error code */
  code:
    | 'INVALID_MASS_FRACTION_SUM'
    | 'INVALID_WATER_CEMENT_RATIO'
    | 'INVALID_CEMENT_CONTENT'
    | 'MISMATCHED_ARRAY_LENGTH'
    | 'INVALID_TEMPERATURE'
    | 'INVALID_DENSITY'
    | 'INVALID_CEMENT_TYPE'
    | 'OTHER';
}

/**
 * Single validation warning
 */
export interface ShrinkageValidationWarning {
  /** Warning field */
  field: string;

  /** Warning message */
  message: string;

  /** Suggested corrective action */
  suggestion?: string;
}

// ============================================================
// TYPE GUARDS
// ============================================================

/**
 * Type guard for ShrinkageMaterial
 */
export function isShrinkageMaterial(obj: any): obj is ShrinkageMaterial {
  return typeof obj === 'object' && typeof obj.name === 'string';
}

/**
 * Type guard for ShrinkageInput
 */
export function isShrinkageInput(obj: any): obj is ShrinkageInput {
  return (
    typeof obj === 'object' &&
    Array.isArray(obj.materials) &&
    obj.materials.every(isShrinkageMaterial) &&
    Array.isArray(obj.massFractions) &&
    Array.isArray(obj.temperatureProfile_C)
  );
}

/**
 * Type guard for ShrinkageStage
 */
export function isShrinkageStage(obj: any): obj is ShrinkageStage {
  return (
    typeof obj === 'object' &&
    typeof obj.name === 'string' &&
    Array.isArray(obj.temperatures_C) &&
    Array.isArray(obj.shrinkage_volumetric_percent) &&
    Array.isArray(obj.shrinkage_linear_percent)
  );
}

/**
 * Type guard for ShrinkageResult
 */
export function isShrinkageResult(obj: any): obj is ShrinkageResult {
  return (
    typeof obj === 'object' &&
    isShrinkageStage(obj.drying) &&
    Array.isArray(obj.firing) &&
    obj.firing.every(isShrinkageStage) &&
    isShrinkageStage(obj.total) &&
    typeof obj.metadata === 'object'
  );
}

