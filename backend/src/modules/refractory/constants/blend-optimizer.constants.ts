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
export const BLEND_OPTIMIZER_CONSTANTS = {
  // ============================================================
  // DEFAULT OPTIMIZATION OPTIONS
  // ============================================================

  /**
   * Default q values for PSD optimization
   * q is the distribution modulus (0.25 = fine, 0.33 = coarse)
   */
  DEFAULT_Q_VALUES: [0.25, 0.27, 0.30, 0.33] as const,

  /**
   * Available PSD calculation methods
   */
  PSD_METHODS: ['Andreasen', 'FunkDinger'] as const,

  /**
   * Available packing density models
   */
  PACKING_MODELS: ['CPM', 'Furnas'] as const,

  /**
   * Available compaction scenarios for refractory materials
   */
  COMPACTION_SCENARIOS: [
    'Self-compacting',
    'Flowable',
    'Vibratable',
    'Hand-pressable',
  ] as const,

  /**
   * Default temperature profile for shrinkage calculation (°C)
   */
  DEFAULT_TEMPERATURE_PROFILE_C: [600, 800, 1000, 1200] as const,

  /**
   * Default water-cement ratio for refractory mixes
   */
  DEFAULT_WATER_CEMENT_RATIO: 0.35,

  /**
   * Default cement content (fraction)
   */
  DEFAULT_CEMENT_CONTENT: 0.1,

  /**
   * Default material density (kg/m³)
   * Used when individual material density is not specified
   */
  DEFAULT_MATERIAL_DENSITY_KGM3: 2700,

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
  COMPACTION_INDICES: {
    'Self-compacting': 4.1,   // Minimal compaction, self-flowing
    'Flowable': 4.5,          // Low compaction, good flow
    'Vibratable': 5.0,        // Medium compaction, moderate flow
    'Hand-pressable': 6.0,    // High compaction, poor flow
  } as const satisfies Record<string, number>,

  /**
   * Compaction pressures for each scenario (MPa)
   * Applied in packing calculations
   *
   * Reference: Banerjee (2004)
   */
  COMPACTION_PRESSURES_MPA: {
    'Self-compacting': 0.01,  // ~1 kPa - gravity only
    'Flowable': 0.05,         // ~50 kPa - light tapping
    'Vibratable': 0.2,        // ~200 kPa - light vibration
    'Hand-pressable': 1.0,    // ~1 MPa - hand pressure
  } as const satisfies Record<string, number>,

  /**
   * q value constraints for each scenario
   * Defines typical q ranges for self-leveling behavior
   */
  Q_VALUE_CONSTRAINTS: {
    'Self-compacting': { min: 0.23, max: 0.26 },  // Fine distribution
    'Flowable': { min: 0.26, max: 0.29 },         // Medium-fine
    'Vibratable': { min: 0.29, max: 0.32 },       // Medium-coarse
    'Hand-pressable': { min: 0.32, max: 0.35 },   // Coarse distribution
  } as const satisfies Record<string, { min: number; max: number }>,

  /**
   * Flowability descriptions for each scenario
   * User-friendly labels for output
   */
  SCENARIO_DESCRIPTIONS: {
    'Self-compacting': 'Self-leveling, minimal compaction required',
    'Flowable': 'Good flow, light tapping helps settlement',
    'Vibratable': 'Requires light vibration for proper packing',
    'Hand-pressable': 'Requires hand pressure for maximum density',
  } as const satisfies Record<string, string>,

  // ============================================================
  // CALCULATION PARAMETERS
  // ============================================================

  /**
   * Decimal places for rounding results
   */
  ROUNDING: {
    density: 2,       // Density: 2 decimal places (2.45 g/mL)
    percentage: 1,    // Percentage: 1 decimal place (45.3%)
    fraction: 4,      // Fractions: 4 decimal places (0.1234)
  } as const,

  /**
   * Physical constraints for calculated values
   */
  PHYSICAL_CONSTRAINTS: {
    minDensity_kgm3: 1500,      // Minimum refractory bulk density
    maxDensity_kgm3: 3200,      // Maximum refractory bulk density
    minPorosity_percent: 5,     // Minimum acceptable porosity
    maxPorosity_percent: 95,    // Maximum acceptable porosity
    minPackingFraction: 0.4,    // Minimum packing efficiency
    maxPackingFraction: 0.95,   // Maximum packing efficiency
  } as const,
} as const;
