/**
 * DEPRECATED: Component Effects Constants
 *
 * ⚠️  MIGRATED TO: component-properties.ts
 *
 * This file is kept for backward compatibility only.
 * All new code should import from component-properties.ts instead.
 *
 * Migration Guide:
 * OLD: import { getComponentEffect, COMPONENT_EFFECTS } from './component-effects'
 * NEW: import { getComponentEffect, COMPONENT_PROPERTIES } from './component-properties'
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
// Re-export everything from unified component-properties for backward compatibility
export { ComponentProperty, COMPONENT_PROPERTIES, COMPONENT_EFFECTS, OXIDE_NETWORK_FORMERS, OXIDE_NETWORK_MODIFIERS, FLUORIDE_COMPONENTS, CHLORIDE_COMPONENTS, AL2O3, SIO2, CR2O3, ZRO2, TIO2, MGO, B2O3, GEO2, NA2O, K2O, LI2O, PBO, CAO, BAO, SRO, MNO, FEO, FE2O3, COO, NIO, CUO, NAF, KF, LIF, CAF2, MGF2, ALF3, NACL, KCL, CACL2, MGCL2, FECL2, FECL3, getComponentEffect, getComponentProperty, getAllComponentNames, getComponentsByCategory, getComponentsByClassification, calculateRefractorinessEffect, calculateLiquidusEffect, calculateViscosityEffect, calculateWeightedThermalConductivity, calculateWeightedSpecificHeat, calculateLiquidCompositionWithEnrichment, calculateSolidCompositionWithEnrichment, extractComponentsByCategory, } from './component-properties';
