/**
 * Refractoriness Calculator Interfaces
 *
 * Type definitions for refractoriness calculations and standards
 * Supports ISO 1893, ASTM C24, GOST 4069 standards
 *
 * References:
 * - EN ISO 1893: Refractoriness Under Load (RUL)
 * - ASTM C24/C71: Pyrometric Cone Equivalent (PCE)
 * - GOST 4069-69: Russian refractoriness standard
 *
 * Date: February 2, 2026
 */

// ============================================================
// INPUT INTERFACES
// ============================================================

/**
 * Refractoriness calculation input
 */
export interface RefractorinessInput {
  /** Oxide composition (Record with component names and wt%) */
  composition: Record<string, number>;

  /** Standards to calculate */
  standards?: RefractorinessStandard[];

  /** Duty class for classification */
  dutyClass?: 'low' | 'intermediate' | 'high';

  /** Test load pressure (MPa) - default 0.2 for ISO 1893 */
  testLoadPressure_MPa?: number;
}

/**
 * Refractoriness standard identifier
 */
export type RefractorinessStandard = 'ISO1893' | 'ASTM_C24' | 'GOST_4069' | 'all';

// ============================================================
// STANDARD-SPECIFIC INTERFACES
// ============================================================

/**
 * ISO 1893 Refractoriness Under Load (RUL) result
 */
export interface ISO1893Result {
  standard: 'ISO1893';

  /** Temperature at 0.5mm deformation (°C) */
  T05_C: number;

  /** Temperature at 1mm deformation (°C) */
  T1_C: number;

  /** Temperature at 2mm deformation (°C) */
  T2_C: number;

  /** Test load applied (Pa) */
  testLoad_Pa: number;

  /** Description of RUL points */
  description: string;
}

/**
 * ASTM C24 Pyrometric Cone Equivalent (PCE) result
 */
export interface ASTMC24Result {
  standard: 'ASTM_C24';

  /** PCE cone number */
  coneNumber: number;

  /** Equivalent temperature (°C) */
  equivalentTemperature_C: number;

  /** Cone melting point (°C) */
  coneMeltingPoint_C: number;

  /** Temperature range for cone (°C) */
  temperatureRange: { min: number; max: number };

  /** Description */
  description: string;
}

/**
 * GOST 4069 Russian standard result
 */
export interface GOST4069Result {
  standard: 'GOST_4069';

  /** GOST cone equivalent */
  coneEquivalent: number;

  /** Refractoriness temperature (°C) */
  refractorinessTemperature_C: number;

  /** Test cone melting point (°C) */
  testConeMeltingPoint_C: number;

  /** Description */
  description: string;
}

// ============================================================
// DUTY CLASS INTERFACES
// ============================================================

/**
 * Duty class classification
 */
export interface DutyClassification {
  /** Duty class */
  dutyClass: 'low' | 'intermediate' | 'high';

  /** Temperature limit (°C) */
  temperatureLimit_C: number;

  /** Refractoriness minimum (°C) */
  minimumRefractoriness_C: number;

  /** Typical applications */
  applications: string[];

  /** Notes about classification */
  notes?: string;
}

// ============================================================
// COMPLETE RESULT INTERFACES
// ============================================================

/**
 * Single refractoriness calculation result
 */
export interface RefractorinessResult {
  /** Calculated refractoriness temperature (°C) - base value */
  estimatedRefractoriness_C: number;

  /** Composition used */
  composition: Record<string, number>;

  /** Component effects breakdown */
  componentEffects: ComponentRefractorinesEffect[];

  /** ISO 1893 result (if requested) */
  iso1893?: ISO1893Result;

  /** ASTM C24 result (if requested) */
  astmC24?: ASTMC24Result;

  /** GOST 4069 result (if requested) */
  gost4069?: GOST4069Result;

  /** Duty class classification */
  dutyClass?: DutyClassification;

  /** Calculation metadata */
  metadata: RefractorinessMetadata;

  /** Warnings or notes */
  warnings: string[];
}

/**
 * Component contribution to refractoriness
 */
export interface ComponentRefractorinesEffect {
  /** Component name */
  component: string;

  /** Weight percentage */
  percentage: number;

  /** Effect value (K) */
  effect: number;

  /** Contribution to total (K) */
  contribution: number;

  /** Component category */
  category: 'network-former' | 'network-modifier' | 'flux' | 'destabilizer';
}

/**
 * Metadata for refractoriness calculation
 */
export interface RefractorinessMetadata {
  /** Calculation timestamp */
  calculatedAt: Date;

  /** Standards calculated */
  standardsCalculated: RefractorinessStandard[];

  /** Test load pressure (Pa) */
  testLoadPressure_Pa: number;

  /** Base refractoriness temperature (°C) */
  baseRefractoriness_C: number;

  /** Calculation method */
  method: 'component-based' | 'model-based';

  /** Confidence level (0-1) */
  confidence: number;

  /** Model version */
  modelVersion: string;
}

// ============================================================
// VALIDATION INTERFACES
// ============================================================

/**
 * Validation result for refractoriness input
 */
export interface RefractorinessValidationResult {
  /** Whether input is valid */
  isValid: boolean;

  /** Validation errors if any */
  errors: RefractorinessValidationError[];

  /** Validation warnings if any */
  warnings: RefractorinessValidationWarning[];
}

/**
 * Single validation error
 */
export interface RefractorinessValidationError {
  /** Error field */
  field: string;

  /** Error message */
  message: string;

  /** Error code */
  code:
    | 'INVALID_COMPOSITION_SUM'
    | 'INVALID_COMPONENT'
    | 'INVALID_DUTY_CLASS'
    | 'INVALID_TEST_LOAD'
    | 'INVALID_STANDARD'
    | 'EMPTY_COMPOSITION'
    | 'OTHER';
}

/**
 * Single validation warning
 */
export interface RefractorinessValidationWarning {
  /** Warning field */
  field: string;

  /** Warning message */
  message: string;

  /** Suggested corrective action */
  suggestion?: string;
}

// ============================================================
// COMPARISON INTERFACES
// ============================================================

/**
 * Comparison of refractoriness across standards
 */
export interface RefractorinessComparison {
  /** Composition being compared */
  composition: Record<string, number>;

  /** Base refractoriness (°C) */
  baseRefractoriness_C: number;

  /** ISO 1893 T2 equivalent (°C) */
  iso1893T2_C?: number;

  /** ASTM C24 equivalent (°C) */
  astmC24_C?: number;

  /** GOST 4069 equivalent (°C) */
  gost4069_C?: number;

  /** Maximum difference between standards (°C) */
  maxDifference_C?: number;

  /** Notes about differences */
  notes?: string[];
}

// ============================================================
// TYPE GUARDS
// ============================================================

/**
 * Type guard for RefractorinessInput
 */
export function isRefractorinessInput(obj: any): obj is RefractorinessInput {
  return (
    typeof obj === 'object' &&
    typeof obj.composition === 'object' &&
    (obj.standards === undefined || Array.isArray(obj.standards))
  );
}

/**
 * Type guard for RefractorinessResult
 */
export function isRefractorinessResult(obj: any): obj is RefractorinessResult {
  return (
    typeof obj === 'object' &&
    typeof obj.estimatedRefractoriness_C === 'number' &&
    typeof obj.composition === 'object' &&
    Array.isArray(obj.componentEffects) &&
    typeof obj.metadata === 'object' &&
    Array.isArray(obj.warnings)
  );
}

/**
 * Type guard for ISO 1893 result
 */
export function isISO1893Result(obj: any): obj is ISO1893Result {
  return (
    typeof obj === 'object' &&
    obj.standard === 'ISO1893' &&
    typeof obj.T05_C === 'number' &&
    typeof obj.T1_C === 'number' &&
    typeof obj.T2_C === 'number'
  );
}

/**
 * Type guard for ASTM C24 result
 */
export function isASTMC24Result(obj: any): obj is ASTMC24Result {
  return (
    typeof obj === 'object' &&
    obj.standard === 'ASTM_C24' &&
    typeof obj.coneNumber === 'number' &&
    typeof obj.equivalentTemperature_C === 'number'
  );
}

/**
 * Type guard for GOST 4069 result
 */
export function isGOST4069Result(obj: any): obj is GOST4069Result {
  return (
    typeof obj === 'object' &&
    obj.standard === 'GOST_4069' &&
    typeof obj.coneEquivalent === 'number' &&
    typeof obj.refractorinessTemperature_C === 'number'
  );
}

