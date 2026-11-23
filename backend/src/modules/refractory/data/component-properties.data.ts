import type { ComponentProperty } from '../types/component-property.type';

/**
 * Refractory component property dataset (33 species).
 * Indexed by chemical formula matching OxideCompositionDto keys (`SiO2`, `Al2O3`, …).
 */

// ============================================================
// OXIDE NETWORK FORMERS (7 components)
// ============================================================

const AL2O3: ComponentProperty = {
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

const SIO2: ComponentProperty = {
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

const CR2O3: ComponentProperty = {
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

const ZRO2: ComponentProperty = {
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

const TIO2: ComponentProperty = {
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

const MGO: ComponentProperty = {
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

const B2O3: ComponentProperty = {
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

const GEO2: ComponentProperty = {
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

const NA2O: ComponentProperty = {
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

const K2O: ComponentProperty = {
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

const LI2O: ComponentProperty = {
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

const PBO: ComponentProperty = {
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

const CAO: ComponentProperty = {
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

const BAO: ComponentProperty = {
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

const SRO: ComponentProperty = {
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

const MNO: ComponentProperty = {
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

const FEO: ComponentProperty = {
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

const FE2O3: ComponentProperty = {
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

const COO: ComponentProperty = {
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

const NIO: ComponentProperty = {
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

const CUO: ComponentProperty = {
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

const NAF: ComponentProperty = {
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

const KF: ComponentProperty = {
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

const LIF: ComponentProperty = {
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

const CAF2: ComponentProperty = {
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

const MGF2: ComponentProperty = {
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

const ALF3: ComponentProperty = {
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

const NACL: ComponentProperty = {
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

const KCL: ComponentProperty = {
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

const CACL2: ComponentProperty = {
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

const MGCL2: ComponentProperty = {
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

const FECL2: ComponentProperty = {
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

const FECL3: ComponentProperty = {
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

/** Single registry: formula → properties. */
export const COMPONENT_PROPERTIES: Record<string, ComponentProperty> = {
  [AL2O3.formula]: AL2O3,
  [SIO2.formula]: SIO2,
  [CR2O3.formula]: CR2O3,
  [ZRO2.formula]: ZRO2,
  [TIO2.formula]: TIO2,
  [MGO.formula]: MGO,
  [B2O3.formula]: B2O3,
  [GEO2.formula]: GEO2,
  [NA2O.formula]: NA2O,
  [K2O.formula]: K2O,
  [LI2O.formula]: LI2O,
  [PBO.formula]: PBO,
  [CAO.formula]: CAO,
  [BAO.formula]: BAO,
  [SRO.formula]: SRO,
  [MNO.formula]: MNO,
  [FEO.formula]: FEO,
  [FE2O3.formula]: FE2O3,
  [COO.formula]: COO,
  [NIO.formula]: NIO,
  [CUO.formula]: CUO,
  [NAF.formula]: NAF,
  [KF.formula]: KF,
  [LIF.formula]: LIF,
  [CAF2.formula]: CAF2,
  [MGF2.formula]: MGF2,
  [ALF3.formula]: ALF3,
  [NACL.formula]: NACL,
  [KCL.formula]: KCL,
  [CACL2.formula]: CACL2,
  [MGCL2.formula]: MGCL2,
  [FECL2.formula]: FECL2,
  [FECL3.formula]: FECL3,
};
