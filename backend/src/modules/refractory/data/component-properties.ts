/**
 * Unified Component Properties for Refractory Calculations
 *
 * This file contains comprehensive component data used across all services:
 * - RefractorinessService: Component effects on refractoriness temperature
 * - PhaseEquilibriumService: Component effects on liquidus temperature & enrichment
 * - ViscosityService: Component effects on viscosity
 * - ThermalPerformanceService: Thermal conductivity & specific heat capacity
 * - Future services: All component-based calculations
 *
 * Structure: Single unified interface per component with ALL properties
 * This enables iteration, loops, and easy extension with new properties.
 *
 * Conventions:
 * - Effect values in Kelvin (K)
 * - Positive effects: Network formers (increase melting point/refractoriness)
 * - Negative effects: Network modifiers/fluxes (decrease melting point/refractoriness)
 * - Conductivity in W/m·K
 * - Specific heat in J/kg·K
 *
 * Date: February 2, 2026
 * Last Updated: February 2, 2026
 */

// ============================================================
// UNIFIED INTERFACE FOR ALL COMPONENT PROPERTIES
// ============================================================

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

// ============================================================
// OXIDE NETWORK FORMERS (7 components)
// ============================================================

export const AL2O3: ComponentProperty = {
  name: 'Aluminum Oxide',
  formula: 'Al2O3',
  category: 'oxide-former',
  classification: 'network-former',
  // Effects (K)
  refractorinessEffect: 800,
  liquidusEffect: 1000,
  viscosityEffect: 5000,
  // Thermal Properties
  conductivity_WmK: 30.0,
  specificHeat_JkgK: 880,
  // Pure Component
  meltingPoint_C: 2072,
  // Enrichment
  liquidEnrichmentFactor: 0.85,
  solidEnrichmentFactor: 1.0,
  description:
    'Strongest refractory former, creates strong Al-O-Al bonds, highest thermal conductivity',
};

export const SIO2: ComponentProperty = {
  name: 'Silicon Dioxide',
  formula: 'SiO2',
  category: 'oxide-former',
  classification: 'network-former',
  refractorinessEffect: 500,
  liquidusEffect: 800,
  viscosityEffect: 3000,
  conductivity_WmK: 1.4,
  specificHeat_JkgK: 840,
  meltingPoint_C: 1710,
  liquidEnrichmentFactor: 0.85,
  solidEnrichmentFactor: 1.0,
  description: 'Common network former, forms Si-O-Si bridging bonds',
};

export const CR2O3: ComponentProperty = {
  name: 'Chromium Oxide',
  formula: 'Cr2O3',
  category: 'oxide-former',
  classification: 'network-former',
  refractorinessEffect: 700,
  liquidusEffect: 1200,
  viscosityEffect: 1800,
  conductivity_WmK: 16.0,
  specificHeat_JkgK: 820,
  meltingPoint_C: 2330,
  liquidEnrichmentFactor: 0.7,
  solidEnrichmentFactor: 0.95,
  description: 'Very strong former, creates strong Cr-O bonds',
};

export const ZRO2: ComponentProperty = {
  name: 'Zirconium Dioxide',
  formula: 'ZrO2',
  category: 'oxide-former',
  classification: 'network-former',
  refractorinessEffect: 600,
  liquidusEffect: 1400,
  viscosityEffect: 2000,
  conductivity_WmK: 2.0,
  specificHeat_JkgK: 550,
  meltingPoint_C: 2715,
  liquidEnrichmentFactor: 0.5,
  solidEnrichmentFactor: 0.95,
  description: 'Extremely strong former, highest melting oxide, strongest liquidus effect',
};

export const TIO2: ComponentProperty = {
  name: 'Titanium Oxide',
  formula: 'TiO2',
  category: 'oxide-former',
  classification: 'network-former',
  refractorinessEffect: 400,
  liquidusEffect: 400,
  viscosityEffect: 1500,
  conductivity_WmK: 11.0,
  specificHeat_JkgK: 800,
  meltingPoint_C: 1843,
  liquidEnrichmentFactor: 1.2,
  solidEnrichmentFactor: 0.8,
  description: 'Mild network former, moderate thermal effects',
};

export const MGO: ComponentProperty = {
  name: 'Magnesium Oxide',
  formula: 'MgO',
  category: 'oxide-former',
  classification: 'network-former',
  refractorinessEffect: -500,
  liquidusEffect: 800,
  viscosityEffect: -3500,
  conductivity_WmK: 40.0,
  specificHeat_JkgK: 940,
  meltingPoint_C: 2852,
  liquidEnrichmentFactor: 0.8,
  solidEnrichmentFactor: 1.0,
  description:
    'Strong network former but acts as flux in refractories, excellent thermal conductivity',
};

export const B2O3: ComponentProperty = {
  name: 'Boron Oxide',
  formula: 'B2O3',
  category: 'oxide-former',
  classification: 'flux',
  refractorinessEffect: 200,
  liquidusEffect: -2000,
  viscosityEffect: 2500,
  conductivity_WmK: 1.3,
  specificHeat_JkgK: 750,
  meltingPoint_C: 450,
  liquidEnrichmentFactor: 2.5,
  solidEnrichmentFactor: 0.1,
  description:
    'Very low melting point despite network structure, extremely strong flux',
};

export const GEO2: ComponentProperty = {
  name: 'Germanium Dioxide',
  formula: 'GeO2',
  category: 'oxide-former',
  classification: 'network-former',
  refractorinessEffect: 300,
  liquidusEffect: 600,
  viscosityEffect: 3500,
  conductivity_WmK: 0.8,
  specificHeat_JkgK: 720,
  meltingPoint_C: 1086,
  liquidEnrichmentFactor: 1.0,
  solidEnrichmentFactor: 1.0,
  description: 'Similar to SiO2, moderate network former',
};

// ============================================================
// OXIDE NETWORK MODIFIERS & FLUXES (14 components)
// ============================================================

export const NA2O: ComponentProperty = {
  name: 'Sodium Oxide',
  formula: 'Na2O',
  category: 'oxide-modifier',
  classification: 'flux',
  refractorinessEffect: -900,
  liquidusEffect: -1500,
  viscosityEffect: -5500,
  conductivity_WmK: 0.8,
  specificHeat_JkgK: 1100,
  meltingPoint_C: 1275,
  liquidEnrichmentFactor: 1.5,
  solidEnrichmentFactor: 0.4,
  description:
    'Strongest oxide flux, extremely depolymerizing, highly soluble in silicates',
};

export const K2O: ComponentProperty = {
  name: 'Potassium Oxide',
  formula: 'K2O',
  category: 'oxide-modifier',
  classification: 'flux',
  refractorinessEffect: -850,
  liquidusEffect: -1400,
  viscosityEffect: -5000,
  conductivity_WmK: 0.7,
  specificHeat_JkgK: 1050,
  meltingPoint_C: 740,
  liquidEnrichmentFactor: 1.5,
  solidEnrichmentFactor: 0.4,
  description: 'Very strong flux, similar to Na2O but slightly less soluble',
};

export const LI2O: ComponentProperty = {
  name: 'Lithium Oxide',
  formula: 'Li2O',
  category: 'oxide-modifier',
  classification: 'flux',
  refractorinessEffect: -800,
  liquidusEffect: -1300,
  viscosityEffect: -6000,
  conductivity_WmK: 0.6,
  specificHeat_JkgK: 1200,
  meltingPoint_C: 1438,
  liquidEnrichmentFactor: 1.8,
  solidEnrichmentFactor: 0.4,
  description: 'Strong flux with depolymerizing effect',
};

export const PBO: ComponentProperty = {
  name: 'Lead Oxide',
  formula: 'PbO',
  category: 'oxide-modifier',
  classification: 'flux',
  refractorinessEffect: -750,
  liquidusEffect: -1800,
  viscosityEffect: -4500,
  conductivity_WmK: 1.5,
  specificHeat_JkgK: 550,
  meltingPoint_C: 888,
  liquidEnrichmentFactor: 2.0,
  solidEnrichmentFactor: 0.4,
  description:
    'Very strong flux, extremely fusible, strong network breaker',
};

export const CAO: ComponentProperty = {
  name: 'Calcium Oxide',
  formula: 'CaO',
  category: 'oxide-modifier',
  classification: 'flux',
  refractorinessEffect: -600,
  liquidusEffect: -800,
  viscosityEffect: -4000,
  conductivity_WmK: 12.0,
  specificHeat_JkgK: 920,
  meltingPoint_C: 2613,
  liquidEnrichmentFactor: 2.0,
  solidEnrichmentFactor: 0.4,
  description:
    'Strong flux, forms CaO-SiO2 eutectic systems, creates anorthite',
};

export const BAO: ComponentProperty = {
  name: 'Barium Oxide',
  formula: 'BaO',
  category: 'oxide-modifier',
  classification: 'flux',
  refractorinessEffect: -550,
  liquidusEffect: -600,
  viscosityEffect: -3800,
  conductivity_WmK: 3.5,
  specificHeat_JkgK: 720,
  meltingPoint_C: 1923,
  liquidEnrichmentFactor: 1.0,
  solidEnrichmentFactor: 0.4,
  description: 'Strong flux with moderate depolymerizing effect',
};

export const SRO: ComponentProperty = {
  name: 'Strontium Oxide',
  formula: 'SrO',
  category: 'oxide-modifier',
  classification: 'flux',
  refractorinessEffect: -520,
  liquidusEffect: -700,
  viscosityEffect: -3600,
  conductivity_WmK: 4.5,
  specificHeat_JkgK: 800,
  meltingPoint_C: 2430,
  liquidEnrichmentFactor: 1.0,
  solidEnrichmentFactor: 0.4,
  description: 'Similar to BaO, strong depolymerizing effect',
};

export const MNO: ComponentProperty = {
  name: 'Manganese(II) Oxide',
  formula: 'MnO',
  category: 'oxide-modifier',
  classification: 'flux',
  refractorinessEffect: -400,
  liquidusEffect: -500,
  viscosityEffect: -3200,
  conductivity_WmK: 7.5,
  specificHeat_JkgK: 700,
  meltingPoint_C: 1785,
  liquidEnrichmentFactor: 1.0,
  solidEnrichmentFactor: 0.4,
  description: 'Moderate flux with mild depolymerizing effect',
};

export const FEO: ComponentProperty = {
  name: 'Iron(II) Oxide',
  formula: 'FeO',
  category: 'oxide-modifier',
  classification: 'flux',
  refractorinessEffect: -450,
  liquidusEffect: -400,
  viscosityEffect: -3000,
  conductivity_WmK: 6.0,
  specificHeat_JkgK: 650,
  meltingPoint_C: 1377,
  liquidEnrichmentFactor: 1.0,
  solidEnrichmentFactor: 0.4,
  description: 'Divalent iron, moderate flux, oxidizes to Fe2O3 at high T',
};

export const FE2O3: ComponentProperty = {
  name: 'Iron(III) Oxide',
  formula: 'Fe2O3',
  category: 'oxide-modifier',
  classification: 'flux',
  refractorinessEffect: -450,
  liquidusEffect: -300,
  viscosityEffect: -3000,
  conductivity_WmK: 5.5,
  specificHeat_JkgK: 680,
  meltingPoint_C: 1565,
  liquidEnrichmentFactor: 2.0,
  solidEnrichmentFactor: 0.4,
  description: 'Trivalent iron, moderate flux, common in natural clays',
};

export const COO: ComponentProperty = {
  name: 'Cobalt Oxide',
  formula: 'CoO',
  category: 'oxide-modifier',
  classification: 'flux',
  refractorinessEffect: -350,
  liquidusEffect: -400,
  viscosityEffect: -2800,
  conductivity_WmK: 8.5,
  specificHeat_JkgK: 680,
  meltingPoint_C: 1935,
  liquidEnrichmentFactor: 1.0,
  solidEnrichmentFactor: 0.4,
  description: 'Mild flux with gentle depolymerizing effect',
};

export const NIO: ComponentProperty = {
  name: 'Nickel Oxide',
  formula: 'NiO',
  category: 'oxide-modifier',
  classification: 'flux',
  refractorinessEffect: -330,
  liquidusEffect: -350,
  viscosityEffect: -2600,
  conductivity_WmK: 9.0,
  specificHeat_JkgK: 700,
  meltingPoint_C: 1955,
  liquidEnrichmentFactor: 1.0,
  solidEnrichmentFactor: 0.4,
  description: 'Mild flux with gentle depolymerizing effect',
};

export const CUO: ComponentProperty = {
  name: 'Copper Oxide',
  formula: 'CuO',
  category: 'oxide-modifier',
  classification: 'flux',
  refractorinessEffect: -320,
  liquidusEffect: -400,
  viscosityEffect: -2400,
  conductivity_WmK: 5.0,
  specificHeat_JkgK: 710,
  meltingPoint_C: 1800,
  liquidEnrichmentFactor: 1.0,
  solidEnrichmentFactor: 0.4,
  description: 'Mild flux, gentle depolymerizing effect',
};

// ============================================================
// FLUORIDE COMPONENTS (6 components)
// ============================================================

export const NAF: ComponentProperty = {
  name: 'Sodium Fluoride',
  formula: 'NaF',
  category: 'fluoride',
  classification: 'flux',
  refractorinessEffect: -850,
  liquidusEffect: -1600,
  viscosityEffect: -5200,
  conductivity_WmK: 3.2,
  specificHeat_JkgK: 950,
  liquidEnrichmentFactor: 2.2,
  solidEnrichmentFactor: 0.1,
  description: 'Very strong flux, more effective than Na2O',
};

export const KF: ComponentProperty = {
  name: 'Potassium Fluoride',
  formula: 'KF',
  category: 'fluoride',
  classification: 'flux',
  refractorinessEffect: -820,
  liquidusEffect: -1500,
  viscosityEffect: -4800,
  conductivity_WmK: 2.5,
  specificHeat_JkgK: 920,
  liquidEnrichmentFactor: 2.0,
  solidEnrichmentFactor: 0.1,
  description: 'Strong flux with strong depolymerizing effect',
};

export const LIF: ComponentProperty = {
  name: 'Lithium Fluoride',
  formula: 'LiF',
  category: 'fluoride',
  classification: 'flux',
  refractorinessEffect: -800,
  liquidusEffect: -1400,
  viscosityEffect: -5500,
  conductivity_WmK: 5.6,
  specificHeat_JkgK: 1050,
  liquidEnrichmentFactor: 2.3,
  solidEnrichmentFactor: 0.1,
  description: 'Strong flux with strong depolymerizing effect',
};

export const CAF2: ComponentProperty = {
  name: 'Calcium Fluoride',
  formula: 'CaF2',
  category: 'fluoride',
  classification: 'flux',
  refractorinessEffect: -600,
  liquidusEffect: -900,
  viscosityEffect: -3500,
  conductivity_WmK: 9.7,
  specificHeat_JkgK: 870,
  liquidEnrichmentFactor: 1.8,
  solidEnrichmentFactor: 0.1,
  description: 'Moderate flux, equivalent to CaO but more volatile',
};

export const MGF2: ComponentProperty = {
  name: 'Magnesium Fluoride',
  formula: 'MgF2',
  category: 'fluoride',
  classification: 'flux',
  refractorinessEffect: -480,
  liquidusEffect: -700,
  viscosityEffect: -3200,
  conductivity_WmK: 8.0,
  specificHeat_JkgK: 880,
  liquidEnrichmentFactor: 1.5,
  solidEnrichmentFactor: 0.1,
  description: 'Mild flux with gentle depolymerizing effect',
};

export const ALF3: ComponentProperty = {
  name: 'Aluminum Fluoride',
  formula: 'AlF3',
  category: 'fluoride',
  classification: 'flux',
  refractorinessEffect: -280,
  liquidusEffect: -1000,
  viscosityEffect: -2500,
  conductivity_WmK: 1.8,
  specificHeat_JkgK: 800,
  liquidEnrichmentFactor: 1.3,
  solidEnrichmentFactor: 0.1,
  description: 'Weak flux despite lower refractoriness effect',
};

// ============================================================
// CHLORIDE COMPONENTS (6 components)
// ============================================================

export const NACL: ComponentProperty = {
  name: 'Sodium Chloride',
  formula: 'NaCl',
  category: 'chloride',
  classification: 'destabilizer',
  refractorinessEffect: -750,
  liquidusEffect: -1400,
  viscosityEffect: -4800,
  conductivity_WmK: 6.4,
  specificHeat_JkgK: 900,
  liquidEnrichmentFactor: 2.5,
  solidEnrichmentFactor: 0.1,
  description:
    'Volatile at high temperature, strong network-breaking effect',
};

export const KCL: ComponentProperty = {
  name: 'Potassium Chloride',
  formula: 'KCl',
  category: 'chloride',
  classification: 'destabilizer',
  refractorinessEffect: -720,
  liquidusEffect: -1300,
  viscosityEffect: -4500,
  conductivity_WmK: 7.0,
  specificHeat_JkgK: 880,
  liquidEnrichmentFactor: 2.5,
  solidEnrichmentFactor: 0.1,
  description: 'Volatile, similar to NaCl',
};

export const CACL2: ComponentProperty = {
  name: 'Calcium Chloride',
  formula: 'CaCl2',
  category: 'chloride',
  classification: 'destabilizer',
  refractorinessEffect: -550,
  liquidusEffect: -800,
  viscosityEffect: -3200,
  conductivity_WmK: 0.95,
  specificHeat_JkgK: 1100,
  liquidEnrichmentFactor: 2.0,
  solidEnrichmentFactor: 0.1,
  description: 'Volatile, moderate flux effect',
};

export const MGCL2: ComponentProperty = {
  name: 'Magnesium Chloride',
  formula: 'MgCl2',
  category: 'chloride',
  classification: 'destabilizer',
  refractorinessEffect: -420,
  liquidusEffect: -600,
  viscosityEffect: -2800,
  conductivity_WmK: 0.8,
  specificHeat_JkgK: 1050,
  liquidEnrichmentFactor: 2.0,
  solidEnrichmentFactor: 0.1,
  description: 'Volatile, mild flux effect',
};

export const FECL2: ComponentProperty = {
  name: 'Iron(II) Chloride',
  formula: 'FeCl2',
  category: 'chloride',
  classification: 'destabilizer',
  refractorinessEffect: -380,
  liquidusEffect: -400,
  viscosityEffect: -2600,
  conductivity_WmK: 4.5,
  specificHeat_JkgK: 800,
  liquidEnrichmentFactor: 2.0,
  solidEnrichmentFactor: 0.1,
  description: 'Volatile, mild flux effect',
};

export const FECL3: ComponentProperty = {
  name: 'Iron(III) Chloride',
  formula: 'FeCl3',
  category: 'chloride',
  classification: 'destabilizer',
  refractorinessEffect: -360,
  liquidusEffect: -350,
  viscosityEffect: -2400,
  conductivity_WmK: 3.2,
  specificHeat_JkgK: 750,
  liquidEnrichmentFactor: 2.0,
  solidEnrichmentFactor: 0.1,
  description: 'Volatile, mild flux effect',
};

// ============================================================
// UNIFIED COMPONENT REGISTRY
// ============================================================

/**
 * All 33 components indexed by formula
 * Single source of truth for all component properties
 * Enables iteration: for (const [formula, props] of Object.entries(COMPONENT_PROPERTIES))
 */
export const COMPONENT_PROPERTIES: Record<string, ComponentProperty> = {
  // Oxide Network Formers (7)
  AL2O3,
  SIO2,
  CR2O3,
  ZRO2,
  TIO2,
  MGO,
  B2O3,
  GEO2,
  // Oxide Network Modifiers (14)
  NA2O,
  K2O,
  LI2O,
  PBO,
  CAO,
  BAO,
  SRO,
  MNO,
  FEO,
  FE2O3,
  COO,
  NIO,
  CUO,
  // Fluorides (6)
  NAF,
  KF,
  LIF,
  CAF2,
  MGF2,
  ALF3,
  // Chlorides (6)
  NACL,
  KCL,
  CACL2,
  MGCL2,
  FECL2,
  FECL3,
} as const;

// Backward compatibility export
export const COMPONENT_EFFECTS = COMPONENT_PROPERTIES;

// ============================================================
// GROUPED EXPORTS BY CATEGORY
// ============================================================

/**
 * All oxide network formers
 */
export const OXIDE_NETWORK_FORMERS = {
  AL2O3,
  SIO2,
  CR2O3,
  ZRO2,
  TIO2,
  MGO,
  B2O3,
  GEO2,
};

/**
 * All oxide network modifiers (fluxes)
 */
export const OXIDE_NETWORK_MODIFIERS = {
  NA2O,
  K2O,
  LI2O,
  PBO,
  CAO,
  BAO,
  SRO,
  MNO,
  FEO,
  FE2O3,
  COO,
  NIO,
  CUO,
};

/**
 * All fluoride components
 */
export const FLUORIDE_COMPONENTS = {
  NAF,
  KF,
  LIF,
  CAF2,
  MGF2,
  ALF3,
};

/**
 * All chloride components
 */
export const CHLORIDE_COMPONENTS = {
  NACL,
  KCL,
  CACL2,
  MGCL2,
  FECL2,
  FECL3,
};

// ============================================================
// HELPER FUNCTIONS - COMPONENT ACCESS
// ============================================================

/**
 * Get component by formula
 * @param formula Component formula (e.g., 'Al2O3')
 * @returns Component properties object or undefined
 */
export function getComponentEffect(
  formula: string,
): ComponentProperty | undefined {
  return COMPONENT_PROPERTIES[formula as keyof typeof COMPONENT_PROPERTIES];
}

// Backward compatibility alias
export function getComponentProperty(
  formula: string,
): ComponentProperty | undefined {
  return getComponentEffect(formula);
}

/**
 * Get all component names (formulas)
 * @returns Array of all component formulas
 */
export function getAllComponentNames(): string[] {
  return Object.keys(COMPONENT_PROPERTIES);
}

/**
 * Get components by category
 * @param category Component category
 * @returns Array of components in that category
 */
export function getComponentsByCategory(
  category: ComponentProperty['category'],
): ComponentProperty[] {
  return Object.values(COMPONENT_PROPERTIES).filter(
    (comp) => comp.category === category,
  );
}

/**
 * Get components by classification
 * @param classification Component classification
 * @returns Array of components with that classification
 */
export function getComponentsByClassification(
  classification: ComponentProperty['classification'],
): ComponentProperty[] {
  return Object.values(COMPONENT_PROPERTIES).filter(
    (comp) => comp.classification === classification,
  );
}

// ============================================================
// HELPER FUNCTIONS - EFFECT CALCULATIONS
// ============================================================

/**
 * Calculate total refractoriness effect from composition
 * Iterates through composition and sums weighted effects
 *
 * @param composition Record with component formulas and weight percentages
 * @returns Total refractoriness effect in Kelvin
 */
export function calculateRefractorinessEffect(
  composition: Record<string, number>,
): number {
  let totalEffect = 0;
  for (const [formula, percentage] of Object.entries(composition)) {
    const component = getComponentEffect(formula);
    if (component && percentage > 0) {
      totalEffect += (percentage / 100) * component.refractorinessEffect;
    }
  }
  return totalEffect;
}

/**
 * Calculate total liquidus effect from composition
 * Iterates through composition and sums weighted effects
 *
 * @param composition Record with component formulas and weight percentages
 * @returns Total liquidus effect in Kelvin
 */
export function calculateLiquidusEffect(
  composition: Record<string, number>,
): number {
  let totalEffect = 0;
  for (const [formula, percentage] of Object.entries(composition)) {
    const component = getComponentEffect(formula);
    if (component && percentage > 0) {
      totalEffect += (percentage / 100) * component.liquidusEffect;
    }
  }
  return totalEffect;
}

/**
 * Calculate total viscosity effect from composition
 * Iterates through composition and sums weighted effects
 *
 * @param composition Record with component formulas and weight percentages
 * @returns Total viscosity effect in Kelvin
 */
export function calculateViscosityEffect(
  composition: Record<string, number>,
): number {
  let totalEffect = 0;
  for (const [formula, percentage] of Object.entries(composition)) {
    const component = getComponentEffect(formula);
    if (component && component.viscosityEffect && percentage > 0) {
      totalEffect += (percentage / 100) * component.viscosityEffect;
    }
  }
  return totalEffect;
}

// ============================================================
// HELPER FUNCTIONS - THERMAL PROPERTIES
// ============================================================

/**
 * Calculate weighted thermal conductivity from composition
 * Iterates through composition and sums weighted conductivities
 *
 * @param composition Record with component formulas and weight percentages
 * @returns Weighted average thermal conductivity (W/m·K)
 */
export function calculateWeightedThermalConductivity(
  composition: Record<string, number>,
): number {
  let k_base = 0;
  for (const [formula, percentage] of Object.entries(composition)) {
    const component = getComponentEffect(formula);
    if (component && percentage > 0) {
      k_base += (percentage / 100) * component.conductivity_WmK;
    }
  }
  return k_base > 0 ? k_base : 1.0;
}

/**
 * Calculate weighted specific heat from composition
 * Iterates through composition and sums weighted specific heats
 *
 * @param composition Record with component formulas and weight percentages
 * @returns Weighted average specific heat (J/kg·K)
 */
export function calculateWeightedSpecificHeat(
  composition: Record<string, number>,
): number {
  let cp = 0;
  let totalWeight = 0;
  for (const [formula, percentage] of Object.entries(composition)) {
    const component = getComponentEffect(formula);
    if (component && percentage > 0) {
      cp += (percentage / 100) * component.specificHeat_JkgK;
      totalWeight += percentage;
    }
  }
  return totalWeight > 0 ? cp : 800; // Default 800 J/kg·K
}

// ============================================================
// HELPER FUNCTIONS - PHASE ENRICHMENT
// ============================================================

/**
 * Calculate liquid composition using enrichment factors
 * Applies liquidEnrichmentFactor to each component
 *
 * @param composition Original bulk composition
 * @returns Liquid composition with enrichment applied
 */
export function calculateLiquidCompositionWithEnrichment(
  composition: Record<string, number>,
): Record<string, number> {
  const liquid: Record<string, number> = {};
  for (const [formula, percentage] of Object.entries(composition)) {
    const component = getComponentEffect(formula);
    if (component && component.liquidEnrichmentFactor && percentage > 0) {
      liquid[formula] = percentage * component.liquidEnrichmentFactor;
    }
  }
  return liquid;
}

/**
 * Calculate solid composition using enrichment factors
 * Applies solidEnrichmentFactor to each component
 *
 * @param composition Original bulk composition
 * @returns Solid composition with enrichment applied
 */
export function calculateSolidCompositionWithEnrichment(
  composition: Record<string, number>,
): Record<string, number> {
  const solid: Record<string, number> = {};
  for (const [formula, percentage] of Object.entries(composition)) {
    const component = getComponentEffect(formula);
    if (component && component.solidEnrichmentFactor && percentage > 0) {
      solid[formula] = percentage * component.solidEnrichmentFactor;
    }
  }
  return solid;
}

/**
 * Extract components by category
 * Organizes composition by component type
 *
 * @param composition Record with component formulas and weight percentages
 * @returns Components organized by category
 */
export function extractComponentsByCategory(composition: Record<string, number>): {
  oxideFormers: Record<string, number>;
  oxideModifiers: Record<string, number>;
  fluorides: Record<string, number>;
  chlorides: Record<string, number>;
} {
  const result = {
    oxideFormers: {} as Record<string, number>,
    oxideModifiers: {} as Record<string, number>,
    fluorides: {} as Record<string, number>,
    chlorides: {} as Record<string, number>,
  };

  for (const [formula, percentage] of Object.entries(composition)) {
    if (percentage <= 0) continue;

    const component = getComponentEffect(formula);
    if (!component) continue;

    switch (component.category) {
      case 'oxide-former':
        result.oxideFormers[formula] = percentage;
        break;
      case 'oxide-modifier':
        result.oxideModifiers[formula] = percentage;
        break;
      case 'fluoride':
        result.fluorides[formula] = percentage;
        break;
      case 'chloride':
        result.chlorides[formula] = percentage;
        break;
    }
  }

  return result;
}

