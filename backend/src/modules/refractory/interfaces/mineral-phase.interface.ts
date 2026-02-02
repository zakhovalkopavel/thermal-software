/**
 * Mineral Phase Identification Interfaces
 *
 * Type definitions for 17 mineral phase identification
 * Identifies crystalline phases in refractory solids
 *
 * References:
 * - Kingery et al. (1976): Introduction to Ceramics
 * - Lee & Rainforth (1994): Ceramic Microstructures
 * - Schacht (2004): Refractories Handbook
 *
 * Date: February 2, 2026
 */

// ============================================================
// MINERAL PHASE INTERFACES
// ============================================================

/**
 * Single mineral phase information
 */
export interface MineralPhaseData {
  /** Phase name (e.g., Mullite, Corundum) */
  phaseName: string;

  /** Chemical formula */
  formula: string;

  /** Crystal structure type */
  crystalStructure: string;

  /** Melting point (°C) */
  meltingPoint_C: number;

  /** Estimated percentage in solid */
  estimatedPercent: number;

  /** Phase stability range */
  stabilityRange?: {
    minTemperature_C: number;
    maxTemperature_C: number;
  };

  /** Density (g/cm³) */
  density_gcm3?: number;

  /** Hardness (Mohs scale or HV) */
  hardness?: number | string;

  /** Physical properties */
  properties: string[];

  /** Notes about phase */
  notes?: string;
}

// ============================================================
// INPUT INTERFACES
// ============================================================

/**
 * Mineral phase identification input
 */
export interface MineralPhaseInput {
  /** Oxide composition (Record with component names and wt%) */
  composition: Record<string, number>;

  /** Temperature (°C) */
  temperature: number;

  /** Include detailed phase properties */
  includeDetails?: boolean;

  /** Sort results by criteria */
  sortBy?: 'name' | 'percentage' | 'meltingPoint';
}

// ============================================================
// RESULT INTERFACES
// ============================================================

/**
 * Complete mineral phase identification result
 */
export interface MineralPhaseResult {
  /** Identified mineral phases */
  phases: MineralPhaseData[];

  /** Total number of phases identified */
  phaseCount: number;

  /** Composition analyzed */
  composition: Record<string, number>;

  /** Temperature used (°C) */
  temperature: number;

  /** Dominant phase */
  dominantPhase?: MineralPhaseData;

  /** Eutectic phases (if detected) */
  eutecticPhases?: MineralPhaseData[];

  /** Secondary phases (minor constituents) */
  secondaryPhases?: MineralPhaseData[];

  /** Metadata */
  metadata: MineralPhaseMetadata;

  /** Warnings or notes */
  warnings: string[];
}

/**
 * Metadata for mineral phase identification
 */
export interface MineralPhaseMetadata {
  /** Calculation timestamp */
  calculatedAt: Date;

  /** Number of phases detected */
  phasesDetected: number;

  /** Total percentage explained by identified phases */
  percentageExplained: number;

  /** Calculation method */
  method: 'stoichiometric' | 'phase-diagram-based';

  /** Phase diagram reference system */
  referenceSystem?: string;

  /** Confidence level (0-1) */
  confidence: number;

  /** Model version */
  modelVersion: string;

  /** Temperature-dependent phase transitions */
  phaseTransitions?: Array<{
    phase: string;
    transitionTemperature_C: number;
    description: string;
  }>;
}

// ============================================================
// PHASE DISTRIBUTION INTERFACES
// ============================================================

/**
 * Phase distribution analysis
 */
export interface PhaseDistribution {
  /** Primary phase and percentage */
  primary: { phase: string; percent: number };

  /** Secondary phases and percentages */
  secondary: Array<{ phase: string; percent: number }>;

  /** Trace phases (< 1%) */
  trace?: Array<{ phase: string; percent: number }>;

  /** Phase relationships (eutectic, peritectic, etc.) */
  relationships?: string[];
}

/**
 * Phase stability information
 */
export interface PhaseStability {
  /** Phase name */
  phase: string;

  /** Stable at current temperature */
  stableAtTemperature: boolean;

  /** Temperature range for stability (°C) */
  stabilityRange: { min: number; max: number };

  /** Metastable under certain conditions */
  metastable?: boolean;

  /** Conditions for metastability */
  metastabilityConditions?: string;
}

// ============================================================
// VALIDATION INTERFACES
// ============================================================

/**
 * Validation result for mineral phase input
 */
export interface MineralPhaseValidationResult {
  /** Whether input is valid */
  isValid: boolean;

  /** Validation errors if any */
  errors: MineralPhaseValidationError[];

  /** Validation warnings if any */
  warnings: MineralPhaseValidationWarning[];
}

/**
 * Single validation error
 */
export interface MineralPhaseValidationError {
  /** Error field */
  field: string;

  /** Error message */
  message: string;

  /** Error code */
  code:
    | 'INVALID_COMPOSITION_SUM'
    | 'INVALID_TEMPERATURE'
    | 'INVALID_COMPONENT'
    | 'EMPTY_COMPOSITION'
    | 'OUT_OF_RANGE'
    | 'OTHER';
}

/**
 * Single validation warning
 */
export interface MineralPhaseValidationWarning {
  /** Warning field */
  field: string;

  /** Warning message */
  message: string;

  /** Suggested corrective action */
  suggestion?: string;

  /** Severity of warning */
  severity: 'info' | 'warning' | 'caution';
}

// ============================================================
// COMPARISON INTERFACES
// ============================================================

/**
 * Phase comparison at different temperatures
 */
export interface PhaseTemperatureComparison {
  /** Composition analyzed */
  composition: Record<string, number>;

  /** Temperature points compared */
  temperatures_C: number[];

  /** Phase distribution at each temperature */
  phaseDistributions: Array<{
    temperature_C: number;
    phases: MineralPhaseData[];
    dominant: string;
  }>;

  /** Phase transitions occurring */
  transitionsObserved: Array<{
    fromPhase: string;
    toPhase: string;
    transitionTemperature_C: number;
  }>;
}

// ============================================================
// TYPE GUARDS
// ============================================================

/**
 * Type guard for MineralPhaseInput
 */
export function isMineralPhaseInput(obj: any): obj is MineralPhaseInput {
  return (
    typeof obj === 'object' &&
    typeof obj.composition === 'object' &&
    typeof obj.temperature === 'number'
  );
}

/**
 * Type guard for MineralPhaseData
 */
export function isMineralPhaseData(obj: any): obj is MineralPhaseData {
  return (
    typeof obj === 'object' &&
    typeof obj.phaseName === 'string' &&
    typeof obj.formula === 'string' &&
    typeof obj.meltingPoint_C === 'number' &&
    typeof obj.estimatedPercent === 'number' &&
    Array.isArray(obj.properties)
  );
}

/**
 * Type guard for MineralPhaseResult
 */
export function isMineralPhaseResult(obj: any): obj is MineralPhaseResult {
  return (
    typeof obj === 'object' &&
    Array.isArray(obj.phases) &&
    obj.phases.every(isMineralPhaseData) &&
    typeof obj.phaseCount === 'number' &&
    typeof obj.composition === 'object' &&
    typeof obj.metadata === 'object' &&
    Array.isArray(obj.warnings)
  );
}

/**
 * Type guard for PhaseDistribution
 */
export function isPhaseDistribution(obj: any): obj is PhaseDistribution {
  return (
    typeof obj === 'object' &&
    typeof obj.primary === 'object' &&
    Array.isArray(obj.secondary)
  );
}

/**
 * Type guard for PhaseStability
 */
export function isPhaseStability(obj: any): obj is PhaseStability {
  return (
    typeof obj === 'object' &&
    typeof obj.phase === 'string' &&
    typeof obj.stableAtTemperature === 'boolean' &&
    typeof obj.stabilityRange === 'object'
  );
}

