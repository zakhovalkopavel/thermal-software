/**
 * Phase Equilibrium Calculator Interfaces
 *
 * Type definitions for liquid-solid phase distribution calculations
 * Supports 33 components with individual melting points and effects
 *
 * References:
 * - Kingery et al. (1976): Introduction to Ceramics
 * - Levin et al. (1964): Phase Diagrams for Ceramists
 * - Nurse et al. (1965): CaO-Al₂O₃-SiO₂ system
 *
 * Date: February 2, 2026
 */

// ============================================================
// INPUT INTERFACES
// ============================================================

/**
 * Complete phase equilibrium calculation request
 */
export interface PhaseEquilibriumInput {
  /** Oxide composition (Record with component names and wt%) */
  composition: Record<string, number>;

  /** Temperature in °C */
  temperature: number;

  /** Total mass for calculation (kg, default 100) */
  totalMass?: number;
}

// ============================================================
// PHASE DATA INTERFACES
// ============================================================

/**
 * Component information in phase
 */
export interface PhaseComponent {
  /** Component name/formula */
  component: string;

  /** Weight percentage in phase */
  percentage: number;

  /** Component effect value (K) */
  effect?: number;
}

/**
 * Mineral phase information
 */
export interface MineralPhase {
  /** Phase name (Mullite, Corundum, etc.) */
  phase: string;

  /** Chemical formula */
  formula: string;

  /** Estimated percentage in solid */
  percent: number;

  /** Melting point (°C) */
  meltingPoint: number;

  /** Physical description */
  description: string;
}

/**
 * Liquid or solid phase data
 */
export interface PhaseData {
  /** Phase percentage (0-100) */
  percent: number;

  /** Phase mass (kg) */
  mass: number;

  /** Phase composition (Record with component names and wt%) */
  composition: Record<string, number>;

  /** Active components in phase */
  components: PhaseComponent[];
}

/**
 * Solid phase data (extends PhaseData with mineral phases)
 */
export interface SolidPhaseData extends PhaseData {
  /** Identified mineral phases in solid */
  mineralPhases: MineralPhase[];
}

// ============================================================
// METADATA INTERFACES
// ============================================================

/**
 * Calculation metadata
 */
export interface PhaseEquilibriumMetadata {
  /** Temperature used (°C) */
  temperature: number;

  /** Total mass used (kg) */
  totalMass: number;

  /** Eutectic temperature for CAS system (°C) */
  eutecticTemperature: number;

  /** Estimated liquidus temperature (°C) */
  estimatedLiquidus: number;

  /** Calculation timestamp */
  calculatedAt: Date;

  /** Calculation method used */
  method: 'CAS-approximation' | 'component-based';

  /** Model parameters */
  parameters: {
    /** Base refractoriness temperature (°C) */
    baseRefractoriness_C: number;

    /** Enrichment model used */
    enrichmentModel: 'selective-melting' | 'eutectic-blending';
  };
}

// ============================================================
// COMPLETE RESULT INTERFACES
// ============================================================

/**
 * Complete phase equilibrium calculation result
 */
export interface PhaseEquilibriumResult {
  /** Liquid phase data */
  liquid: PhaseData;

  /** Solid phase data with mineral phases */
  solid: SolidPhaseData;

  /** Calculation metadata */
  metadata: PhaseEquilibriumMetadata;

  /** Calculation warnings/notes */
  warnings: string[];
}

// ============================================================
// VALIDATION INTERFACES
// ============================================================

/**
 * Validation result for phase equilibrium input
 */
export interface PhaseEquilibriumValidationResult {
  /** Whether input is valid */
  isValid: boolean;

  /** Validation errors if any */
  errors: PhaseEquilibriumValidationError[];

  /** Validation warnings if any */
  warnings: PhaseEquilibriumValidationWarning[];
}

/**
 * Single validation error
 */
export interface PhaseEquilibriumValidationError {
  /** Error field */
  field: string;

  /** Error message */
  message: string;

  /** Error code */
  code:
    | 'INVALID_COMPOSITION_SUM'
    | 'INVALID_TEMPERATURE'
    | 'INVALID_COMPONENT'
    | 'INVALID_TOTAL_MASS'
    | 'EMPTY_COMPOSITION'
    | 'OTHER';
}

/**
 * Single validation warning
 */
export interface PhaseEquilibriumValidationWarning {
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
 * Eutectic point definition
 */
export interface EutecticPoint {
  /** Eutectic temperature (°C) */
  temperature: number;

  /** Eutectic composition (Record with component wt%) */
  composition: Record<string, number>;

  /** Description */
  description: string;
}

/**
 * Liquidus calculation intermediate result
 */
export interface LiquidusResult {
  /** Estimated liquidus temperature (°C) */
  temperature: number;

  /** Confidence level (0-1) */
  confidence: number;

  /** Method used for estimation */
  method: string;

  /** Calculation notes */
  notes?: string;
}

// ============================================================
// TYPE GUARDS
// ============================================================

/**
 * Type guard for PhaseEquilibriumInput
 */
export function isPhaseEquilibriumInput(obj: any): obj is PhaseEquilibriumInput {
  return (
    typeof obj === 'object' &&
    typeof obj.composition === 'object' &&
    typeof obj.temperature === 'number'
  );
}

/**
 * Type guard for PhaseData
 */
export function isPhaseData(obj: any): obj is PhaseData {
  return (
    typeof obj === 'object' &&
    typeof obj.percent === 'number' &&
    typeof obj.mass === 'number' &&
    typeof obj.composition === 'object' &&
    Array.isArray(obj.components)
  );
}

/**
 * Type guard for MineralPhase
 */
export function isMineralPhase(obj: any): obj is MineralPhase {
  return (
    typeof obj === 'object' &&
    typeof obj.phase === 'string' &&
    typeof obj.formula === 'string' &&
    typeof obj.percent === 'number' &&
    typeof obj.meltingPoint === 'number'
  );
}

/**
 * Type guard for PhaseEquilibriumResult
 */
export function isPhaseEquilibriumResult(obj: any): obj is PhaseEquilibriumResult {
  return (
    typeof obj === 'object' &&
    isPhaseData(obj.liquid) &&
    isPhaseData(obj.solid) &&
    typeof obj.metadata === 'object' &&
    Array.isArray(obj.warnings)
  );
}

