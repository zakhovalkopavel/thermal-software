/**
 * Component Property Interface
 *
 * Unified interface for all 33 refractory components
 * Contains all properties used across all services:
 * - Effects (refractoriness, liquidus, viscosity)
 * - Thermal properties (conductivity, specific heat)
 * - Phase enrichment factors
 * - Pure component properties
 *
 * Date: February 2, 2026
 */

/**
 * Complete component definition with ALL properties in one place
 * Enables easy iteration and extension
 */
export interface ComponentProperty {
  // Identity & Classification
  name: string; // Full component name
  formula: string; // Chemical formula
  category: 'oxide-former' | 'oxide-modifier' | 'fluoride' | 'chloride';
  classification:
    | 'network-former'
    | 'network-modifier'
    | 'flux'
    | 'destabilizer';

  // Effects on Material Properties (in Kelvin)
  refractorinessEffect: number; // Effect on refractoriness temperature
  liquidusEffect: number; // Effect on liquidus temperature
  viscosityEffect?: number; // Effect on viscosity

  // Thermal Properties
  conductivity_WmK: number; // Thermal conductivity (W/m·K)
  specificHeat_JkgK: number; // Specific heat capacity (J/kg·K)

  // Pure Component Properties
  meltingPoint_C?: number; // Pure component melting point (°C)

  // Phase Enrichment Factors
  liquidEnrichmentFactor?: number; // Enrichment in liquid phase (multiplier)
  solidEnrichmentFactor?: number; // Enrichment in solid phase (multiplier)

  // Documentation
  description?: string; // Brief description
}

