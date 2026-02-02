/**
 * Glass Viscosity Calculator Interfaces
 *
 * Type definitions for glass viscosity with ASTM C965-96 fixed points
 * Supports 33 components with glass-specific calculations
 *
 * References:
 * - ASTM C965-96: Measuring Viscosity of Glass Above Softening Point
 * - Lakatos et al. (1972): Viscosity-temperature relations
 * - Giordano et al. (2008): Viscosity of magmatic liquids
 *
 * Date: February 2, 2026
 */

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
// RESULT INTERFACES
// ============================================================

/**
 * Glass viscosity calculation result
 */
export interface GlassViscosityResult {
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

  /** ASTM C965-96 fixed points */
  fixedPoints: {
    softening_Point_C: number;
    working_Point_C: number;
    annealing_Point_C: number;
    strain_Point_C: number;
  };

  /** Composition used */
  composition: Record<string, number>;

  /** Component effects breakdown */
  components: {
    networkFormers: Array<{ component: string; percentage: number; effect: number }>;
    networkModifiers: Array<{ component: string; percentage: number; effect: number }>;
    fluorides: Array<{ component: string; percentage: number; effect: number }>;
    chlorides: Array<{ component: string; percentage: number; effect: number }>;
  };

  /** Metadata */
  metadata: GlassViscosityMetadata;

  /** Warnings or notes */
  warnings: string[];
}

/**
 * Metadata for glass viscosity calculation
 */
export interface GlassViscosityMetadata {
  /** Calculation timestamp */
  calculatedAt: Date;

  /** Calculation method */
  method: 'Arrhenius';

  /** ASTM standard */
  standard: 'ASTM_C965_96';

  /** Base parameters used */
  baseParameters: {
    A_base: number;
    B_base: number;
  };

  /** Confidence level (0-1) */
  confidence: number;

  /** Valid temperature range (°C) */
  validRange: { min: number; max: number };

  /** Glass type identified (if applicable) */
  glassType?: 'soda-lime' | 'borosilicate' | 'lead-crystal' | 'aluminosilicate' | 'other';
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

