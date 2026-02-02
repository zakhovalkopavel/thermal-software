/**
 * Carbide & Nitride Materials
 *
 * High-performance ceramics with carbide and nitride bonds
 * Includes materials that are ONLY carbides or ONLY nitrides
 */

import { MaterialEntry } from '../interfaces/material.interface';

export const CARBIDE_NITRIDE_MATERIALS: MaterialEntry[] = [
  // =================================================================
  // CARBIDES
  // =================================================================
  {
    materialId: 'silicon_carbide',
    name: 'Silicon Carbide (SiC)',
    type: 'aggregate',
    materialGroup: ['carbide'],
    orderNumber: 12,
    description: 'SiC, extremely hard, high thermal conductivity, oxidation resistant',
    composition: { SiC: 98.5, C: 0.5, SiO2: 0.5, Fe2O3: 0.3, Al2O3: 0.2 },
    rho_true_after_firing_kgm3: 3210,
    availableParticleSizes: ['COARSE_6_3', 'MEDIUM_3_1', 'FINE_1_01', 'FINE_03_01', 'POWDER_015_005'],
    thermalProperties: {
      thermalConductivity_WmK: 120.0,
      specificHeat_JkgK: 750,
      thermalExpansion_perK: 4.5e-6,
    },
    mechanicalProperties: {
      crushingStrength_MPa: 350,
      youngModulus_GPa: 410,
      hardness_HV: 2500, // Very hard!
    },
    chemicalShrinkage_volFrac: 0.0005,
    activationEnergy_Jmol: 680000,
    meltingPoint_C: 2730,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/silicon-carbide',
    supplier: 'Saint-Gobain / Washington Mills',
    isActive: true,
  },
  {
    materialId: 'titanium_carbide',
    name: 'Titanium Carbide (TiC)',
    type: 'aggregate',
    materialGroup: ['carbide'],
    orderNumber: 25,
    description: 'TiC, extremely hard, metallic conductivity',
    composition: { TiC: 98.5, TiO2: 0.8, C: 0.4, Fe: 0.3 },
    rho_true_after_firing_kgm3: 4930,
    availableParticleSizes: ['MEDIUM_3_1', 'FINE_1_01', 'FINE_03_01', 'POWDER_015_005'],
    thermalProperties: {
      thermalConductivity_WmK: 30.0,
      specificHeat_JkgK: 520,
      thermalExpansion_perK: 7.7e-6,
    },
    mechanicalProperties: {
      youngModulus_GPa: 450,
      hardness_HV: 2800,
    },
    chemicalShrinkage_volFrac: 0.0003,
    activationEnergy_Jmol: 700000,
    meltingPoint_C: 3160,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/titanium-carbide',
    isActive: true,
  },
  {
    materialId: 'chromium_carbide',
    name: 'Chromium Carbide (Cr3C2)',
    type: 'aggregate',
    materialGroup: ['carbide'],
    orderNumber: 28,
    description: 'Cr3C2, wear resistant, corrosion resistant',
    composition: { Cr3C2: 98.0, Cr2O3: 1.2, C: 0.5, Fe: 0.3 },
    rho_true_after_firing_kgm3: 6680,
    availableParticleSizes: ['FINE_1_01', 'FINE_03_01', 'POWDER_015_005'],
    thermalProperties: {
      thermalConductivity_WmK: 19.0,
      specificHeat_JkgK: 500,
      thermalExpansion_perK: 10.3e-6,
    },
    mechanicalProperties: {
      hardness_HV: 1800,
    },
    chemicalShrinkage_volFrac: 0.0002,
    activationEnergy_Jmol: 680000,
    meltingPoint_C: 1890,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/chromium-carbide',
    isActive: true,
  },
  {
    materialId: 'boron_carbide',
    name: 'Boron Carbide (B4C)',
    type: 'aggregate',
    materialGroup: ['carbide'],
    orderNumber: 26,
    description: 'B4C, third hardest material, neutron absorber',
    composition: { B4C: 98.5, C: 0.8, B2O3: 0.4, Fe: 0.3 },
    rho_true_after_firing_kgm3: 2520,
    availableParticleSizes: ['FINE_1_01', 'FINE_03_01', 'POWDER_015_005'],
    thermalProperties: {
      thermalConductivity_WmK: 30.0,
      specificHeat_JkgK: 950,
      thermalExpansion_perK: 5.6e-6,
    },
    mechanicalProperties: {
      youngModulus_GPa: 450,
      hardness_HV: 3500, // Third hardest material!
    },
    chemicalShrinkage_volFrac: 0.0002,
    activationEnergy_Jmol: 710000,
    meltingPoint_C: 2450,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/boron-carbide',
    supplier: '3M / H.C. Starck',
    isActive: true,
  },
  {
    materialId: 'graphite',
    name: 'Graphite',
    type: 'aggregate',
    materialGroup: ['carbide'], // Pure carbon, grouped with carbides
    orderNumber: 22,
    description: 'C, high temperature stability, reducing atmosphere',
    composition: { C: 99.5, SiO2: 0.2, Fe2O3: 0.15, Al2O3: 0.1, CaO: 0.05 },
    rho_true_after_firing_kgm3: 2260,
    availableParticleSizes: ['COARSE_6_3', 'MEDIUM_3_1', 'FINE_1_01', 'FINE_03_01', 'POWDER_015_005', 'ULTRAFINE'],
    thermalProperties: {
      thermalConductivity_WmK: 150.0,
      specificHeat_JkgK: 710,
      thermalExpansion_perK: 5.0e-6,
    },
    mechanicalProperties: {
      hardness_HV: 10, // Very soft!
    },
    chemicalShrinkage_volFrac: 0.0001,
    activationEnergy_Jmol: 720000,
    meltingPoint_C: 3650,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/graphite',
    isActive: true,
  },

  // =================================================================
  // NITRIDES
  // =================================================================
  {
    materialId: 'aluminum_nitride',
    name: 'Aluminum Nitride (AlN)',
    type: 'aggregate',
    materialGroup: ['nitride'],
    orderNumber: 24,
    description: 'AlN, very high thermal conductivity, electrical insulator',
    composition: { AlN: 99.0, Al2O3: 0.5, Y2O3: 0.3, CaO: 0.2 },
    rho_true_after_firing_kgm3: 3260,
    availableParticleSizes: ['FINE_03_01', 'POWDER_015_005', 'ULTRAFINE'],
    thermalProperties: {
      thermalConductivity_WmK: 180.0,
      specificHeat_JkgK: 740,
      thermalExpansion_perK: 4.5e-6,
    },
    mechanicalProperties: {
      youngModulus_GPa: 330,
      hardness_HV: 1200,
    },
    chemicalShrinkage_volFrac: 0.0005,
    activationEnergy_Jmol: 620000,
    meltingPoint_C: 2200,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/aluminum-nitride',
    supplier: 'Tokuyama / Toyal',
    isActive: true,
  },
  {
    materialId: 'boron_nitride_hbn',
    name: 'Hexagonal Boron Nitride (hBN)',
    type: 'additive',
    materialGroup: ['nitride'],
    orderNumber: 23,
    description: 'BN, "white graphite", excellent machinability, thermal shock resistance',
    composition: { BN: 99.0, B2O3: 0.5, CaO: 0.3, MgO: 0.2 },
    rho_true_after_firing_kgm3: 2270,
    availableParticleSizes: ['FINE_03_01', 'POWDER_015_005', 'ULTRAFINE'],
    thermalProperties: {
      thermalConductivity_WmK: 60.0,
      specificHeat_JkgK: 800,
      thermalExpansion_perK: 3.0e-6,
    },
    mechanicalProperties: {
      hardness_HV: 20, // Very soft, like graphite
    },
    chemicalShrinkage_volFrac: 0.0002,
    activationEnergy_Jmol: 650000,
    meltingPoint_C: 3000,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/boron-nitride',
    supplier: 'Saint-Gobain / 3M',
    isActive: true,
  },
  {
    materialId: 'titanium_nitride',
    name: 'Titanium Nitride (TiN)',
    type: 'additive',
    materialGroup: ['nitride'],
    orderNumber: 27,
    description: 'TiN, gold color, hard coating, electrically conductive',
    composition: { TiN: 98.5, TiO2: 0.8, N: 0.4, Ti: 0.3 },
    rho_true_after_firing_kgm3: 5220,
    availableParticleSizes: ['POWDER_015_005', 'ULTRAFINE'],
    thermalProperties: {
      thermalConductivity_WmK: 19.0,
      specificHeat_JkgK: 590,
      thermalExpansion_perK: 9.4e-6,
    },
    mechanicalProperties: {
      hardness_HV: 2100,
    },
    chemicalShrinkage_volFrac: 0.0003,
    activationEnergy_Jmol: 650000,
    meltingPoint_C: 2930,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/titanium-nitride',
    isActive: true,
  },
  {
    materialId: 'silicon_nitride',
    name: 'Silicon Nitride',
    type: 'aggregate',
    materialGroup: ['nitride'],
    orderNumber: 14,
    description: 'Si3N4, excellent thermal shock resistance, high strength',
    composition: { Si: 60.0, N: 40.0 },
    rho_true_after_firing_kgm3: 3440,
    availableParticleSizes: ['FINE_1_01', 'FINE_03_01', 'POWDER_015_005'],
    thermalProperties: {
      thermalConductivity_WmK: 30.0,
      specificHeat_JkgK: 700,
      thermalExpansion_perK: 3.2e-6,
    },
    mechanicalProperties: {
      crushingStrength_MPa: 300,
      modulusOfRupture_MPa: 800,
      youngModulus_GPa: 310,
      hardness_HV: 1600,
    },
    chemicalShrinkage_volFrac: 0.001,
    activationEnergy_Jmol: 680000,
    meltingPoint_C: 1900,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/silicon-nitride',
    supplier: 'Kyocera / CeramTec',
    isActive: true,
  },
];

