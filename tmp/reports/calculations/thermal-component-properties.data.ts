/**
 * DEPRECATED: Thermal Component Properties
 *
 * ⚠️  MIGRATED TO: component-properties.ts
 *
 * This file is kept for backward compatibility only.
 * All new code should import from component-properties.ts instead.
 *
 * Migration Guide:
 * OLD: import { calculateWeightedThermalConductivity } from './thermal-component-properties.data'
 * NEW: import { calculateWeightedThermalConductivity } from '../component-properties'
 *
 * The unified component-properties.ts file contains ALL properties:
 * - Effects (refractoriness, liquidus, viscosity)
 * - Thermal properties (conductivity, specific heat)
 * - Phase enrichment factors
 * - All 33 components
 * - All helper functions
 *
 * Date: February 2, 2026
 */

// Re-export thermal-related functions from unified component-properties for backward compatibility
export {
  calculateWeightedThermalConductivity,
  calculateWeightedSpecificHeat,
  extractComponentsByCategory,
  getComponentEffect,
  getAllComponentNames,
} from '../component-properties';

// Re-export component interface
export type { ComponentProperty as ThermalComponentProperty } from '../component-properties';

