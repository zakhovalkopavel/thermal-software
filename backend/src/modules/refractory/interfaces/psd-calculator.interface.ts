/**
 * PSD Calculator Interfaces
 *
 * Type definitions for Particle Size Distribution calculations
 * Supports Andreasen and Funk-Dinger methods
 *
 * Date: February 2, 2026
 */

// ============================================================
// INPUT INTERFACES
// ============================================================

/**
 * Particle size fraction definition
 */
export interface PSDFraction {
  /** Minimum particle diameter (mm) */
  dMin_mm: number;

  /** Maximum particle diameter (mm) */
  dMax_mm: number;

  /** Whether this fraction size is fixed (cannot be optimized) */
  isFixed?: boolean;

  /** Mass fraction for this size class (0-1) */
  massFraction?: number;
}

/**
 * Optional parameters for PSD calculation
 */
export interface PSDCalculationOptions {
  /** Minimum diameter override (mm) - if not provided, uses smallest dMin_mm */
  Dmin_mm?: number;

  /** Maximum diameter override (mm) - if not provided, uses largest dMax_mm */
  Dmax_mm?: number;
}

/**
 * Complete PSD calculation request
 */
export interface PSDCalculationRequest {
  /** Array of particle size fractions */
  fractions: PSDFraction[];

  /** Distribution modulus (typically 0.2-0.4) */
  q: number;

  /** Optional calculation parameters */
  options?: PSDCalculationOptions;
}

// ============================================================
// OUTPUT INTERFACES
// ============================================================

/**
 * PSD calculation result
 */
export interface PSDResult {
  /** Method used (Andreasen or Funk-Dinger) */
  method: 'Andreasen' | 'FunkDinger';

  /** Distribution modulus value used */
  q: number;

  /** Calculated mass fractions (decimal, 0-1) */
  massFractions: number[];

  /** Rounded mass fractions as percentages (0-100) */
  massFractionsRoundedPercent: number[];

  /** Effective minimum diameter (mm) */
  Dmin_mm: number;

  /** Effective maximum diameter (mm) */
  Dmax_mm: number;
}

// ============================================================
// VALIDATION INTERFACES
// ============================================================

/**
 * Validation result for PSD input
 */
export interface PSDValidationResult {
  /** Whether input is valid */
  isValid: boolean;

  /** Validation errors if any */
  errors: PSDValidationError[];

  /** Validation warnings if any */
  warnings: PSDValidationWarning[];
}

/**
 * Single validation error
 */
export interface PSDValidationError {
  /** Error field */
  field: string;

  /** Error message */
  message: string;

  /** Error code */
  code:
    | 'INVALID_Q_VALUE'
    | 'INVALID_DIAMETER_RANGE'
    | 'INVALID_MASS_FRACTION'
    | 'NO_VARIABLE_FRACTIONS'
    | 'FIXED_FRACTIONS_TOO_HIGH'
    | 'DMIN_GREATER_THAN_DMAX'
    | 'OTHER';
}

/**
 * Single validation warning
 */
export interface PSDValidationWarning {
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
 * Type guard for PSDFraction
 */
export function isPSDFraction(obj: any): obj is PSDFraction {
  return (
    typeof obj === 'object' &&
    typeof obj.dMin_mm === 'number' &&
    typeof obj.dMax_mm === 'number'
  );
}

/**
 * Type guard for PSDCalculationRequest
 */
export function isPSDCalculationRequest(obj: any): obj is PSDCalculationRequest {
  return (
    typeof obj === 'object' &&
    Array.isArray(obj.fractions) &&
    obj.fractions.every(isPSDFraction) &&
    typeof obj.q === 'number'
  );
}

/**
 * Type guard for PSDResult
 */
export function isPSDResult(obj: any): obj is PSDResult {
  return (
    typeof obj === 'object' &&
    typeof obj.method === 'string' &&
    typeof obj.q === 'number' &&
    Array.isArray(obj.massFractions) &&
    Array.isArray(obj.massFractionsRoundedPercent) &&
    typeof obj.Dmin_mm === 'number' &&
    typeof obj.Dmax_mm === 'number'
  );
}

