/**
 * Packing Calculator Interfaces
 *
 * Type definitions for packing density calculations
 * Supports CPM (Compressible Packing Model) and Furnas sequential filling model
 *
 * References:
 * - de Larrard, F. (1999) "Concrete Mixture Proportioning"
 * - Furnas, C.C. (1931) "Grading Aggregates"
 *
 * Date: February 2, 2026
 */

// ============================================================
// COMMON INPUT INTERFACES
// ============================================================

/**
 * Base packing calculation input
 */
export interface PackingInput {
  /** Mass fractions of each size class (must sum to 1) */
  massFractions: number[];

  /** Bulk densities of materials (kg/m³) */
  densities_kgm3: number[];

  /** Mean diameters of each size class (mm) */
  diameters_mm: number[];
}

// ============================================================
// CPM-SPECIFIC INTERFACES
// ============================================================

/**
 * CPM (Compressible Packing Model) calibration parameters
 */
export interface CPMCalibration {
  /** Virtual packing limit (0-1, default 0.64) */
  beta0?: number;

  /** Compaction constant (default 9.0) */
  K?: number;
}

/**
 * Complete CPM input with optional calibration and compaction
 */
export interface CPMInput extends PackingInput {
  /** Compaction pressure (MPa, optional) */
  compactionPressure_MPa?: number;

  /** CPM calibration parameters */
  calibration?: CPMCalibration;
}

// ============================================================
// FURNAS-SPECIFIC INTERFACES
// ============================================================

/**
 * Complete Furnas input with optional efficiency
 */
export interface FurnasInput extends PackingInput {
  /** Void filling efficiency factor (0-1, default 0.75) */
  efficiencyFactor?: number;
}

// ============================================================
// OUTPUT INTERFACES
// ============================================================

/**
 * Packing calculation result
 */
export interface PackingResult {
  /** Packing model used */
  model: 'CPM' | 'Furnas';

  /** Packing fraction (0-1) - volume of solids / total volume */
  packingFraction_phi: number;

  /** Initial porosity (0-1) - volume of voids / total volume */
  porosity_initial: number;

  /** Effective packing density - dimensionless */
  effectivePackingDensity: number;
}

/**
 * Detailed packing calculation result with intermediate values
 */
export interface PackingResultDetailed extends PackingResult {
  /** Virtual packing values for each size class */
  virtualPacking?: number[];

  /** Volume fractions (converted from mass fractions) */
  volumeFractions?: number[];

  /** Compaction index applied (CPM only) */
  compactionIndex?: number;

  /** Void filling efficiency applied (Furnas only) */
  adjustedEfficiency?: number[];
}

// ============================================================
// VALIDATION INTERFACES
// ============================================================

/**
 * Validation result for packing calculation input
 */
export interface PackingValidationResult {
  /** Whether input is valid */
  isValid: boolean;

  /** Validation errors if any */
  errors: PackingValidationError[];

  /** Validation warnings if any */
  warnings: PackingValidationWarning[];
}

/**
 * Single validation error
 */
export interface PackingValidationError {
  /** Error field */
  field: string;

  /** Error message */
  message: string;

  /** Error code */
  code:
    | 'INVALID_MASS_FRACTION_SUM'
    | 'INVALID_DENSITY'
    | 'INVALID_DIAMETER'
    | 'MISMATCHED_ARRAY_LENGTH'
    | 'INVALID_PRESSURE'
    | 'INVALID_CALIBRATION'
    | 'OTHER';
}

/**
 * Single validation warning
 */
export interface PackingValidationWarning {
  /** Warning field */
  field: string;

  /** Warning message */
  message: string;

  /** Suggested corrective action */
  suggestion?: string;
}

// ============================================================
// INTERMEDIATE CALCULATION INTERFACES
// ============================================================

/**
 * Sorted fraction data for Furnas calculation
 */
export interface SortedFractions {
  /** Volume fractions sorted by size */
  volumeFractions: number[];

  /** Diameters sorted by size */
  diameters: number[];
}

// ============================================================
// TYPE GUARDS
// ============================================================

/**
 * Type guard for PackingInput
 */
export function isPackingInput(obj: any): obj is PackingInput {
  return (
    typeof obj === 'object' &&
    Array.isArray(obj.massFractions) &&
    Array.isArray(obj.densities_kgm3) &&
    Array.isArray(obj.diameters_mm) &&
    obj.massFractions.every((v: any) => typeof v === 'number') &&
    obj.densities_kgm3.every((v: any) => typeof v === 'number') &&
    obj.diameters_mm.every((v: any) => typeof v === 'number')
  );
}

/**
 * Type guard for CPMInput
 */
export function isCPMInput(obj: any): obj is CPMInput {
  return (
    isPackingInput(obj) &&
    (obj.compactionPressure_MPa === undefined || typeof obj.compactionPressure_MPa === 'number') &&
    (obj.calibration === undefined ||
      (typeof obj.calibration === 'object' &&
        (obj.calibration.beta0 === undefined || typeof obj.calibration.beta0 === 'number') &&
        (obj.calibration.K === undefined || typeof obj.calibration.K === 'number')))
  );
}

/**
 * Type guard for FurnasInput
 */
export function isFurnasInput(obj: any): obj is FurnasInput {
  return (
    isPackingInput(obj) &&
    (obj.efficiencyFactor === undefined || typeof obj.efficiencyFactor === 'number')
  );
}

/**
 * Type guard for PackingResult
 */
export function isPackingResult(obj: any): obj is PackingResult {
  return (
    typeof obj === 'object' &&
    (obj.model === 'CPM' || obj.model === 'Furnas') &&
    typeof obj.packingFraction_phi === 'number' &&
    typeof obj.porosity_initial === 'number' &&
    typeof obj.effectivePackingDensity === 'number'
  );
}

