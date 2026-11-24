/**
 * Complete component definition with ALL properties in one place.
 * Enables easy iteration and extension across refractory services.
 */
export type ComponentProperty = {
  // Identity & Classification
  name: string;
  formula: string;
  category: 'oxide-former' | 'oxide-modifier' | 'fluoride' | 'chloride';
  classification:
    | 'network-former'
    | 'network-modifier'
    | 'flux'
    | 'destabilizer';

  // Effects on Material Properties (in Kelvin)
  refractorinessEffect: number;
  liquidusEffect: number;
  viscosityEffect?: number;

  // Thermal Properties
  conductivity_WmK: number;
  specificHeat_JkgK: number;

  // Pure Component Properties
  meltingPoint_C?: number;

  // Phase Enrichment Factors
  liquidEnrichmentFactor?: number;
  solidEnrichmentFactor?: number;

  // Documentation
  description?: string;
};
