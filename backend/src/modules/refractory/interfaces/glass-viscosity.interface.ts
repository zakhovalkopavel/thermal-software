/**
 * Glass Viscosity Calculator Interfaces
 *
 * Type definitions for glass viscosity with ASTM C965-96 fixed points
 * Supports 33 components with composition-dependent models
 *
 * References:
 * - ASTM C965-96: Measuring Viscosity of Glass Above Softening Point
 * - Lakatos et al. (1972): Viscosity-temperature relations
 * - Giordano et al. (2008): Viscosity of magmatic liquids
 *
 * Date: February 8, 2026
 * Version: 2.0 - Composition-dependent models
 */

import { ViscosityModel, ViscosityModelType, ConfidenceLevel, ExtrapolationRisk } from '../enums/viscosity-model.enum';

// ============================================================
// INPUT INTERFACES
// ============================================================

/**
 * Glass viscosity calculation input
 */
export interface GlassViscosityInput {
  /** Glass composition (Record with component names and wt%) */
  composition: Record<string, number>;

  /** Temperature (°C) */
  temperature: number;

  /** Pressure (MPa, optional) */
  pressure_MPa?: number;
}

// ============================================================
// ASTM FIXED POINT INTERFACES
// ============================================================

/**
 * ASTM C965-96 fixed point definition
 */
export interface ASTMFixedPoint {
  /** Fixed point name */
  name: 'softening' | 'working' | 'annealing' | 'strain';

  /** Temperature (°C) */
  temperature_C: number;

  /** Viscosity at point (Pa·s) */
  viscosity_Pas: number;

  /** Description of processing window */
  description: string;
}

// ============================================================
// MODEL INFORMATION
// ============================================================

/**
 * Information about the viscosity model used
 */
export interface ModelInfo {
  /** Equation type used */
  type: ViscosityModelType;

  /** Glass system detected */
  systemType: ViscosityModel;

  /** Human-readable system name */
  systemName: string;

  /** VFT/Arrhenius parameters */
  parameters: ModelParameters;
}

/**
 * Model parameters (VFT or Arrhenius)
 */
export interface ModelParameters {
  /** Pre-exponential constant */
  A: number;

  /** Activation energy parameter (K) */
  B: number;

  /** VFT temperature (K), only for VFT model */
  T0?: number;

  /** Valid temperature range for this model */
  temperatureRange: {
    min_C: number;
    max_C: number;
  };
}

// ============================================================
// FIXED POINTS
// ============================================================

/**
 * ASTM C965-96 fixed points
 */
export interface FixedPoints {
  /** Melting point: η = 1 Pa·s */
  meltingPoint_C: number;

  /** Flow point: η = 10^4 Pa·s */
  flowPoint_C: number;

  /** Working point: η = 10^3 Pa·s */
  workingPoint_C: number;

  /** Softening point: η = 10^6.6 Pa·s (ASTM C338) */
  softeningPoint_C: number;

  /** Annealing point: η = 10^12 Pa·s (ASTM C336) */
  annealingPoint_C: number;

  /** Strain point: η = 10^13.5 Pa·s (ASTM C336) */
  strainPoint_C: number;

  /** Temperature spans between key points */
  spans?: FixedPointSpans;
}

/**
 * Temperature spans between fixed points
 */
export interface FixedPointSpans {
  /** Melting to strain point */
  meltingToStrain_C: number;

  /** Working to softening */
  workingToSoftening_C: number;

  /** Softening to annealing */
  softeningToAnnealing_C: number;

  /** Annealing to strain */
  annealingToStrain_C: number;
}

// ============================================================
// VALIDATION STATUS
// ============================================================

/**
 * Composition validation status
 */
export interface ValidationStatus {
  /** Detected system description */
  systemDetected: string;

  /** Overall confidence level */
  confidenceLevel: ConfidenceLevel;

  /** Warnings about composition */
  warnings: string[];

  /** Number of components within validated ranges */
  componentsInRange: number;

  /** Number of components outside validated ranges */
  componentsOutOfRange: number;

  /** Risk level for extrapolation */
  extrapolationRisk: ExtrapolationRisk;

  /** Specific composition issues */
  compositionIssues?: CompositionIssue[];
}

/**
 * Specific composition issue
 */
export interface CompositionIssue {
  component: string;
  actualValue: number;
  validRange: { min: number; max: number };
  severity: 'WARNING' | 'ERROR';
  impact: string;
}

// ============================================================
// COMPONENT BREAKDOWN
// ============================================================

/**
 * Component breakdown and effects
 */
export interface ComponentBreakdown {
  networkFormers: ComponentEffect[];
  networkModifiers: ComponentEffect[];
  fluorides: ComponentEffect[];
  chlorides: ComponentEffect[];
}

/**
 * Individual component effect
 */
export interface ComponentEffect {
  component: string;
  percentage: number;
  effect: number;
}

// ============================================================
// RESULT INTERFACES
// ============================================================

/**
 * Complete glass viscosity calculation result
 */
export interface GlassViscosityResult {
  /** Calculated viscosity at given temperature */
  viscosity_Pas: number;

  /** Input temperature */
  temperature_C: number;

  /** Log10 of viscosity for easier comparison */
  logViscosity: number;

  /** Model information and parameters */
  model: ModelInfo;

  /** ASTM C965-96 fixed points */
  fixedPoints: FixedPoints;

  /** Composition validation and warnings */
  validation: ValidationStatus;

  /** Component breakdown and effects */
  components: ComponentBreakdown;

  /** Normalized composition used for calculation */
  composition: Record<string, number>;

  /** Metadata */
  metadata: GlassViscosityMetadata;
}

/**
 * Metadata for glass viscosity calculation
 */
export interface GlassViscosityMetadata {
  /** Calculation timestamp */
  calculatedAt: Date;

  /** Model type used */
  modelType: ViscosityModelType;

  /** ASTM standard */
  standard: 'ASTM_C965_96';

  /** Confidence level */
  confidence: ConfidenceLevel;

  /** Reference for model parameters */
  reference: string;

  /** Version of algorithm */
  version: string;
}

// ============================================================
// PROCESSING WINDOW INTERFACES
// ============================================================

/**
 * Glass processing window
 */
export interface GlassProcessingWindow {
  /** Window name */
  name: string;

  /** Temperature range (°C) */
  temperatureRange: { min: number; max: number };

  /** Viscosity range (Pa·s) */
  viscosityRange: { min: number; max: number };

  /** Processing method suitable for this window */
  processMethod: string;

  /** Notes about processing */
  notes?: string;
}

// ============================================================
// VALIDATION INTERFACES
// ============================================================

/**
 * Validation result for glass viscosity input
 */
export interface GlassViscosityValidationResult {
  /** Whether input is valid */
  isValid: boolean;

  /** Validation errors if any */
  errors: GlassViscosityValidationError[];

  /** Validation warnings if any */
  warnings: GlassViscosityValidationWarning[];
}

/**
 * Single validation error
 */
export interface GlassViscosityValidationError {
  /** Error field */
  field: string;

  /** Error message */
  message: string;

  /** Error code */
  code:
    | 'INVALID_COMPOSITION_SUM'
    | 'INVALID_TEMPERATURE'
    | 'INVALID_COMPONENT'
    | 'INVALID_GLASS_TYPE'
    | 'OUT_OF_RANGE'
    | 'OTHER';
}

/**
 * Single validation warning
 */
export interface GlassViscosityValidationWarning {
  /** Warning field */
  field: string;

  /** Warning message */
  message: string;

  /** Suggested corrective action */
  suggestion?: string;

  /** Impact on calculation */
  impact: 'low' | 'medium' | 'high';
}

// ============================================================
// TYPE GUARDS
// ============================================================

/**
 * Type guard for GlassViscosityInput
 */
export function isGlassViscosityInput(obj: any): obj is GlassViscosityInput {
  return (
    typeof obj === 'object' &&
    typeof obj.composition === 'object' &&
    typeof obj.temperature === 'number'
  );
}

/**
 * Type guard for GlassViscosityResult
 */
export function isGlassViscosityResult(obj: any): obj is GlassViscosityResult {
  return (
    typeof obj === 'object' &&
    typeof obj.viscosity_Pas === 'number' &&
    typeof obj.temperature === 'number' &&
    typeof obj.composition === 'object' &&
    typeof obj.fixedPoints === 'object' &&
    typeof obj.metadata === 'object'
  );
}

/**
 * Type guard for ASTMFixedPoint
 */
export function isASTMFixedPoint(obj: any): obj is ASTMFixedPoint {
  return (
    typeof obj === 'object' &&
    typeof obj.name === 'string' &&
    typeof obj.temperature_C === 'number' &&
    typeof obj.viscosity_Pas === 'number'
  );
}

