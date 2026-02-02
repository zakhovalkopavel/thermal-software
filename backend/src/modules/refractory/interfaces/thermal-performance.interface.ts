/**
 * Thermal Performance Calculator Interfaces
 *
 * Type definitions for thermal conductivity, specific heat, and thermal expansion
 * Supports 33 components with individual thermal properties
 *
 * References:
 * - Kingery et al. (1976): Introduction to Ceramics
 * - Schacht (2004): Refractories Handbook
 * - Maxwell-Eucken equation for porous materials
 *
 * Date: February 2, 2026
 */

// ============================================================
// INPUT INTERFACES
// ============================================================

/**
 * Base thermal property input
 */
export interface ThermalInput {
  /** Oxide composition (Record with component names and wt%) */
  composition: Record<string, number>;

  /** Temperature (°C) */
  temperature: number;

  /** Porosity fraction (0-1) */
  porosity?: number;

  /** Pore size distribution type */
  poreType?: 'open' | 'closed' | 'mixed';
}

/**
 * Thermal conductivity calculation input
 */
export interface ThermalConductivityInput extends ThermalInput {
  /** Reference temperature for property (°C, default 20) */
  referenceTemperature?: number;

  /** Material bulk density (kg/m³) */
  bulkDensity_kgm3?: number;
}

/**
 * Specific heat capacity calculation input
 */
export interface SpecificHeatInput extends ThermalInput {
  /** Heat capacity model to use */
  model?: 'polynomial' | 'linear' | 'constant';
}

/**
 * Thermal expansion calculation input
 */
export interface ThermalExpansionInput extends ThermalInput {
  /** Reference temperature (°C, default 20) */
  referenceTemperature?: number;

  /** Temperature range for calculation (°C) */
  temperatureRange?: { min: number; max: number };

  /** Expansion model type */
  model?: 'linear' | 'polynomial' | 'exponential';
}

// ============================================================
// COMPONENT PROPERTY INTERFACES
// ============================================================

/**
 * Thermal properties of a component
 */
export interface ComponentThermalProperties {
  /** Component name */
  component: string;

  /** Thermal conductivity (W/m·K at reference temperature) */
  thermalConductivity_WmK: number;

  /** Specific heat capacity (J/kg·K at reference temperature) */
  specificHeat_JkgK: number;

  /** Linear thermal expansion coefficient (1/K) */
  linearExpansion_1perK: number;

  /** Temperature dependence coefficient */
  temperatureDependence?: number;

  /** Reference temperature (°C) */
  referenceTemperature: number;
}

/**
 * Component-weighted thermal property
 */
export interface WeightedThermalProperty {
  /** Component name */
  component: string;

  /** Weight percentage in composition */
  percentage: number;

  /** Thermal property value */
  value: number;

  /** Contribution to total */
  contribution: number;
}

// ============================================================
// RESULT INTERFACES
// ============================================================

/**
 * Thermal conductivity result
 */
export interface ThermalConductivityResult {
  /** Effective thermal conductivity (W/m·K) */
  effectiveConductivity_WmK: number;

  /** Conductivity in solid phase (W/m·K) */
  solidConductivity_WmK: number;

  /** Conductivity in pore phase (W/m·K) */
  poreConductivity_WmK: number;

  /** Porosity correction factor */
  porosityFactor: number;

  /** Temperature (°C) */
  temperature: number;

  /** Composition-weighted components */
  componentContributions: WeightedThermalProperty[];

  /** Calculation model used */
  model: 'Maxwell-Eucken' | 'series' | 'parallel' | 'composite';

  /** Notes about calculation */
  notes?: string;
}

/**
 * Specific heat capacity result
 */
export interface SpecificHeatResult {
  /** Specific heat capacity (J/kg·K) */
  specificHeat_JkgK: number;

  /** Temperature (°C) */
  temperature: number;

  /** Composition-weighted components */
  componentContributions: WeightedThermalProperty[];

  /** Calculation model used */
  model: 'polynomial' | 'linear' | 'constant';

  /** Temperature range validity */
  validRange: { min: number; max: number };

  /** Accuracy estimate (%) */
  accuracy_percent?: number;
}

/**
 * Thermal expansion result
 */
export interface ThermalExpansionResult {
  /** Linear expansion coefficient (1/K at temperature) */
  linearExpansionCoefficient_1perK: number;

  /** Average expansion coefficient over range (1/K) */
  averageExpansionCoefficient_1perK?: number;

  /** Volumetric expansion coefficient (1/K) */
  volumetricExpansionCoefficient_1perK: number;

  /** Length change from reference (%) */
  lengthChange_percent?: number;

  /** Reference temperature (°C) */
  referenceTemperature: number;

  /** Current temperature (°C) */
  temperature: number;

  /** Composition-weighted components */
  componentContributions: WeightedThermalProperty[];

  /** Calculation model used */
  model: 'linear' | 'polynomial' | 'exponential';
}

/**
 * Complete thermal performance result (all properties)
 */
export interface ThermalPerformanceResult {
  /** Thermal conductivity result */
  conductivity?: ThermalConductivityResult;

  /** Specific heat result */
  specificHeat?: SpecificHeatResult;

  /** Thermal expansion result */
  expansion?: ThermalExpansionResult;

  /** Temperature used (°C) */
  temperature: number;

  /** Composition used */
  composition: Record<string, number>;

  /** Calculation metadata */
  metadata: ThermalPerformanceMetadata;

  /** Warnings or notes */
  warnings: string[];
}

/**
 * Metadata for thermal performance calculation
 */
export interface ThermalPerformanceMetadata {
  /** Calculation timestamp */
  calculatedAt: Date;

  /** Porosity used (if applicable) */
  porosity?: number;

  /** Bulk density used (if applicable) */
  bulkDensity_kgm3?: number;

  /** Reference temperature (°C) */
  referenceTemperature: number;

  /** Calculation method/model used */
  method: string;

  /** Data source */
  dataSource: 'literature' | 'model' | 'experimental' | 'hybrid';

  /** Confidence level (0-1) */
  confidence: number;
}

// ============================================================
// VALIDATION INTERFACES
// ============================================================

/**
 * Validation result for thermal input
 */
export interface ThermalValidationResult {
  /** Whether input is valid */
  isValid: boolean;

  /** Validation errors if any */
  errors: ThermalValidationError[];

  /** Validation warnings if any */
  warnings: ThermalValidationWarning[];
}

/**
 * Single validation error
 */
export interface ThermalValidationError {
  /** Error field */
  field: string;

  /** Error message */
  message: string;

  /** Error code */
  code:
    | 'INVALID_COMPOSITION_SUM'
    | 'INVALID_TEMPERATURE'
    | 'INVALID_POROSITY'
    | 'INVALID_COMPONENT'
    | 'OUT_OF_RANGE'
    | 'OTHER';
}

/**
 * Single validation warning
 */
export interface ThermalValidationWarning {
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
// INTERMEDIATE CALCULATION INTERFACES
// ============================================================

/**
 * Temperature-dependent property at specific point
 */
export interface TemperatureDependentProperty {
  /** Temperature (°C) */
  temperature: number;

  /** Property value at temperature */
  value: number;

  /** Confidence/reliability (0-1) */
  confidence: number;
}

/**
 * Property curve (multiple temperatures)
 */
export interface PropertyCurve {
  /** Property name */
  property: string;

  /** Unit of property */
  unit: string;

  /** Data points */
  data: TemperatureDependentProperty[];

  /** Curve fit type */
  fitType?: 'linear' | 'polynomial' | 'exponential' | 'spline';

  /** R² value for fit */
  r2?: number;
}

// ============================================================
// TYPE GUARDS
// ============================================================

/**
 * Type guard for ThermalInput
 */
export function isThermalInput(obj: any): obj is ThermalInput {
  return (
    typeof obj === 'object' &&
    typeof obj.composition === 'object' &&
    typeof obj.temperature === 'number'
  );
}

/**
 * Type guard for ThermalConductivityInput
 */
export function isThermalConductivityInput(
  obj: any
): obj is ThermalConductivityInput {
  const o: any = obj;
  return (
    isThermalInput(obj) &&
    (o.bulkDensity_kgm3 === undefined || typeof o.bulkDensity_kgm3 === 'number')
  );
}

/**
 * Type guard for ThermalConductivityResult
 */
export function isThermalConductivityResult(
  obj: any
): obj is ThermalConductivityResult {
  return (
    typeof obj === 'object' &&
    typeof obj.effectiveConductivity_WmK === 'number' &&
    typeof obj.temperature === 'number' &&
    Array.isArray(obj.componentContributions)
  );
}

/**
 * Type guard for SpecificHeatResult
 */
export function isSpecificHeatResult(obj: any): obj is SpecificHeatResult {
  return (
    typeof obj === 'object' &&
    typeof obj.specificHeat_JkgK === 'number' &&
    typeof obj.temperature === 'number'
  );
}

/**
 * Type guard for ThermalExpansionResult
 */
export function isThermalExpansionResult(
  obj: any
): obj is ThermalExpansionResult {
  return (
    typeof obj === 'object' &&
    typeof obj.linearExpansionCoefficient_1perK === 'number' &&
    typeof obj.temperature === 'number'
  );
}

/**
 * Type guard for ThermalPerformanceResult
 */
export function isThermalPerformanceResult(obj: any): obj is ThermalPerformanceResult {
  const o: any = obj;
  return (
    typeof obj === 'object' &&
    typeof obj.temperature === 'number' &&
    typeof obj.composition === 'object' &&
    typeof o.metadata === 'object' &&
    Array.isArray(obj.warnings)
  );
}

