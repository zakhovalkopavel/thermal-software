import { WorkabilityType } from '../enums/workability.enum';

/**
 * Water Demand Service Constants
 *
 * Research-backed factors and limits for water demand calculation
 *
 * References:
 * - de Larrard, F. (1999): Water fills 40-45% of void volume
 * - Banerjee, S. (2004): Refractory castables need 35-50% water fill
 * - Pileggi et al. (2001): Rheology depends on water-void ratio
 */

/**
 * Workability factors - percentage of void space filled with water
 *
 * These factors determine how much of the porosity needs to be filled
 * with water to achieve desired workability level
 */
export const WORKABILITY_FACTORS: Record<WorkabilityType, number> = {
  [WorkabilityType.FIRM]: 0.38,      // 38% of void space (firm paste, minimal water)
  [WorkabilityType.STANDARD]: 0.42,  // 42% of void space (standard workability, DEFAULT)
  [WorkabilityType.FLOWABLE]: 0.50,  // 50% of void space (self-compacting, flowable)
};

/**
 * Water Demand Constants
 */
export const WATER_DEMAND_CONSTANTS = {
  /** Minimum valid packing fraction */
  MIN_PACKING_FRACTION: 0.0,

  /** Maximum valid packing fraction */
  MAX_PACKING_FRACTION: 1.0,

  /** Maximum realistic water demand (%) */
  MAX_WATER_DEMAND: 50.0,

  /** Minimum realistic water demand (%) */
  MIN_WATER_DEMAND: 0.0,

  /** Decimal places for formatting results */
  DECIMAL_PLACES: 1,

  /** Default workability type */
  DEFAULT_WORKABILITY: WorkabilityType.STANDARD,

  /** Porosity formatting decimal places */
  POROSITY_DECIMAL_PLACES: 1,
} as const;

/**
 * Typical water demand ranges for different castable types
 * Used for validation and warnings
 */
export const TYPICAL_WATER_DEMAND_RANGES = {
  highAlumina: { min: 9, max: 12, typical: 10.9 },
  magnesia: { min: 8, max: 10, typical: 9.2 },
  ultraDense: { min: 7, max: 9, typical: 8.4 },
  selfFlowing: { min: 11, max: 15, typical: 13.5 },
  vibratable: { min: 9, max: 12, typical: 10.5 },
} as const;

