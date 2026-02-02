/**
 * Viscosity Calculator Interfaces
 *
 * Type definitions for melt viscosity calculations
 * Supports Arrhenius model with 33 components
 *
 * References:
 * - Urbain et al. (1982): Viscosity of silicate melts
 * - Giordano et al. (2008): Viscosity of magmatic liquids
 * - Mills (1993): Slag Atlas
 *
 * Date: February 2, 2026
 */

// ============================================================
// INPUT INTERFACES
// ============================================================

/**
 * Viscosity calculation input
 */
export interface ViscosityInput {
  /** Liquid composition (Record with component names and wt%) */
  composition: Record<string, number>;

  /** Temperature (°C) */
  temperature: number;

  /** Pressure (MPa, optional) */
  pressure_MPa?: number;
}

// ============================================================
// RESULT INTERFACES
// ============================================================

/**
 * Viscosity calculation result
 */
export interface ViscosityResult {
  /** Viscosity (Pa·s) */
  viscosity_Pas: number;

  /** Logarithm of viscosity (base 10) */
  logViscosity: number;

  /** Temperature (°C) */
  temperature: number;

  /** Arrhenius pre-exponential factor */
  arrhenius_A: number;

  /** Arrhenius activation energy/R (K) */
  arrhenius_B: number;

  /** Composition used */
  composition: Record<string, number>;

  /** Component effects breakdown */
  components: {
    oxides: Array<{ component: string; percentage: number; effect: number }>;
    fluorides: Array<{ component: string; percentage: number; effect: number }>;
    chlorides: Array<{ component: string; percentage: number; effect: number }>;
  };

  /** Metadata */
  metadata: ViscosityMetadata;

  /** Warnings or notes */
  warnings: string[];
}

/**
 * Metadata for viscosity calculation
 */
export interface ViscosityMetadata {
  /** Calculation timestamp */
  calculatedAt: Date;

  /** Calculation method */
  method: 'Arrhenius';

  /** Base parameters used */
  baseParameters: {
    A_base: number;
    B_base: number;
  };

  /** Confidence level (0-1) */
  confidence: number;

  /** Valid temperature range (°C) */
  validRange: { min: number; max: number };
}

// ============================================================
// VALIDATION INTERFACES
// ============================================================

/**
 * Validation result for viscosity input
 */
export interface ViscosityValidationResult {
  /** Whether input is valid */
  isValid: boolean;

  /** Validation errors if any */
  errors: ViscosityValidationError[];

  /** Validation warnings if any */
  warnings: ViscosityValidationWarning[];
}

/**
 * Single validation error
 */
export interface ViscosityValidationError {
  /** Error field */
  field: string;

  /** Error message */
  message: string;

  /** Error code */
  code:
    | 'INVALID_COMPOSITION_SUM'
    | 'INVALID_TEMPERATURE'
    | 'INVALID_COMPONENT'
    | 'INVALID_PRESSURE'
    | 'OUT_OF_RANGE'
    | 'OTHER';
}

/**
 * Single validation warning
 */
export interface ViscosityValidationWarning {
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
 * Type guard for ViscosityInput
 */
export function isViscosityInput(obj: any): obj is ViscosityInput {
  return (
    typeof obj === 'object' &&
    typeof obj.composition === 'object' &&
    typeof obj.temperature === 'number'
  );
}

/**
 * Type guard for ViscosityResult
 */
export function isViscosityResult(obj: any): obj is ViscosityResult {
  return (
    typeof obj === 'object' &&
    typeof obj.viscosity_Pas === 'number' &&
    typeof obj.temperature === 'number' &&
    typeof obj.composition === 'object' &&
    typeof obj.metadata === 'object'
  );
}

