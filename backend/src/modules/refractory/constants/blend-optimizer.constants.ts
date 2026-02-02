/**
 * Blend Optimizer Constants
 *
 * Contains all configuration parameters for blend optimization:
 * - Default PSD calculation methods (Andreasen, Funk-Dinger)
 * - q values for PSD distribution control
 * - Packing models (CPM, Furnas)
 * - Compaction scenarios and their parameters
 * - Material densities
 * - Temperature profiles
 * - Water-cement ratios
 *
 * Reference:
 * - de Larrard, F. (1999) "Concrete Mixture Proportioning"
 * - Funk & Dinger (1994) "Predictive Process Control"
 * - Banerjee, S. (2004) "Monolithic Refractories"
 *
 * Date: February 2, 2026
 */

// ============================================================
// DEFAULT OPTIMIZATION OPTIONS
// ============================================================

/**
 * Default q values for PSD optimization
 * q is the distribution modulus (0.25 = fine, 0.33 = coarse)
 */
export const DEFAULT_Q_VALUES = [0.25, 0.27, 0.30, 0.33];

/**
 * Available PSD calculation methods
 */
export const PSD_METHODS = ['Andreasen', 'FunkDinger'] as const;

/**
 * Available packing density models
 */
export const PACKING_MODELS = ['CPM', 'Furnas'] as const;

/**
 * Available compaction scenarios for refractory materials
 */
export const COMPACTION_SCENARIOS = [
  'Self-compacting',
  'Flowable',
  'Vibratable',
  'Hand-pressable',
] as const;

/**
 * Default temperature profile for shrinkage calculation (°C)
 */
export const DEFAULT_TEMPERATURE_PROFILE_C = [600, 800, 1000, 1200];

/**
 * Default water-cement ratio for refractory mixes
 */
export const DEFAULT_WATER_CEMENT_RATIO = 0.35;

/**
 * Default cement content (fraction)
 */
export const DEFAULT_CEMENT_CONTENT = 0.1;

/**
 * Default material density (kg/m³)
 * Used when individual material density is not specified
 */
export const DEFAULT_MATERIAL_DENSITY_KGM3 = 2700;

// ============================================================
// COMPACTION SCENARIO PARAMETERS
// ============================================================

/**
 * Compaction indices for each scenario
 * Higher K values indicate more aggressive compaction/densification
 * Used in CPM (Composite Packing Model)
 *
 * Reference: de Larrard (1999)
 */
export const COMPACTION_INDICES: Record<string, number> = {
  'Self-compacting': 4.1,   // Minimal compaction, self-flowing
  'Flowable': 4.5,          // Low compaction, good flow
  'Vibratable': 5.0,        // Medium compaction, moderate flow
  'Hand-pressable': 6.0,    // High compaction, poor flow
};

/**
 * Compaction pressures for each scenario (MPa)
 * Applied in packing calculations
 *
 * Reference: Banerjee (2004)
 */
export const COMPACTION_PRESSURES_MPA: Record<string, number> = {
  'Self-compacting': 0.01,  // ~1 kPa - gravity only
  'Flowable': 0.05,         // ~50 kPa - light tapping
  'Vibratable': 0.2,        // ~200 kPa - light vibration
  'Hand-pressable': 1.0,    // ~1 MPa - hand pressure
};

/**
 * q value constraints for each scenario
 * Defines typical q ranges for self-leveling behavior
 */
export const Q_VALUE_CONSTRAINTS: Record<string, { min: number; max: number }> = {
  'Self-compacting': { min: 0.23, max: 0.26 },  // Fine distribution
  'Flowable': { min: 0.26, max: 0.29 },         // Medium-fine
  'Vibratable': { min: 0.29, max: 0.32 },       // Medium-coarse
  'Hand-pressable': { min: 0.32, max: 0.35 },   // Coarse distribution
};

/**
 * Flowability descriptions for each scenario
 * User-friendly labels for output
 */
export const SCENARIO_DESCRIPTIONS: Record<string, string> = {
  'Self-compacting': 'Self-leveling, minimal compaction required',
  'Flowable': 'Good flow, light tapping helps settlement',
  'Vibratable': 'Requires light vibration for proper packing',
  'Hand-pressable': 'Requires hand pressure for maximum density',
};

// ============================================================
// CALCULATION PARAMETERS
// ============================================================

/**
 * Decimal places for rounding results
 */
export const ROUNDING = {
  density: 2,       // Density: 2 decimal places (2.45 g/mL)
  percentage: 1,    // Percentage: 1 decimal place (45.3%)
  fraction: 4,      // Fractions: 4 decimal places (0.1234)
};

/**
 * Physical constraints for calculated values
 */
export const PHYSICAL_CONSTRAINTS = {
  minDensity_kgm3: 1500,      // Minimum refractory bulk density
  maxDensity_kgm3: 3200,      // Maximum refractory bulk density
  minPorosity_percent: 5,     // Minimum acceptable porosity
  maxPorosity_percent: 95,    // Maximum acceptable porosity
  minPackingFraction: 0.4,    // Minimum packing efficiency
  maxPackingFraction: 0.95,   // Maximum packing efficiency
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get compaction index for a given scenario
 * @param scenario Compaction scenario name
 * @returns K value (compaction index)
 */
export function getCompactionIndex(scenario: string): number {
  return COMPACTION_INDICES[scenario] || COMPACTION_INDICES['Vibratable'];
}

/**
 * Get compaction pressure for a given scenario
 * @param scenario Compaction scenario name
 * @returns Pressure in MPa
 */
export function getCompactionPressure(scenario: string): number {
  return COMPACTION_PRESSURES_MPA[scenario] || COMPACTION_PRESSURES_MPA['Vibratable'];
}

/**
 * Get q value constraints for a given scenario
 * @param scenario Compaction scenario name
 * @returns Object with min and max q values
 */
export function getQValueConstraints(scenario: string): { min: number; max: number } {
  return Q_VALUE_CONSTRAINTS[scenario] || Q_VALUE_CONSTRAINTS['Vibratable'];
}

/**
 * Get scenario description
 * @param scenario Compaction scenario name
 * @returns Description string
 */
export function getScenarioDescription(scenario: string): string {
  return SCENARIO_DESCRIPTIONS[scenario] || 'Unknown scenario';
}

/**
 * Validate scenario name
 * @param scenario Compaction scenario name
 * @returns true if valid scenario, false otherwise
 */
export function isValidScenario(scenario: string): boolean {
  return COMPACTION_SCENARIOS.includes(scenario as any);
}

/**
 * Validate PSD method name
 * @param method PSD method name
 * @returns true if valid method, false otherwise
 */
export function isValidPSDMethod(method: string): boolean {
  return PSD_METHODS.includes(method as any);
}

/**
 * Validate packing model name
 * @param model Packing model name
 * @returns true if valid model, false otherwise
 */
export function isValidPackingModel(model: string): boolean {
  return PACKING_MODELS.includes(model as any);
}

