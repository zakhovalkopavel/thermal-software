/**
 * Silicate Materials
 *
 * Silicate minerals and aggregates
 * Materials with silicate as PRIMARY group (SiO2-based)
 */

import { MaterialEntry } from '../interfaces/material.interface';

export const SILICATE_MATERIALS: MaterialEntry[] = [
  // =================================================================
  // CHAMOTTE (Fired clay aluminosilicates)
  // =================================================================
  {
    materialId: 'chamotte_low_alumina',
    name: 'Chamotte (Low Alumina)',
    type: 'aggregate',
    materialGroup: ['silicate', 'oxide'],
    orderNumber: 4,
    description: '35-40% Al2O3, economical fired clay aggregate',
    composition: { Al2O3: 37.0, SiO2: 55.0, CaO: 1.8, Fe2O3: 4.0, MgO: 0.7, TiO2: 1.5 },
    rho_true_after_firing_kgm3: 2600,
    availableParticleSizes: ['COARSE_10_6', 'COARSE_6_3', 'MEDIUM_3_1', 'FINE_1_01', 'FINE_06_004', 'MIXED_6_004'],
    thermalProperties: {
      thermalConductivity_WmK: 1.3,
      specificHeat_JkgK: 840,
      thermalExpansion_perK: 5.8e-6,
    },
    mechanicalProperties: {
      hardness_HV: 800,
    },
    chemicalShrinkage_volFrac: 0.002,
    activationEnergy_Jmol: 420000,
    meltingPoint_C: 1580,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/chamotte',
    isActive: true,
  },
  {
    materialId: 'chamotte_standard',
    name: 'Chamotte (Standard)',
    type: 'aggregate',
    materialGroup: ['silicate', 'oxide'],
    orderNumber: 5,
    description: '40-50% Al2O3, typical aluminosilicate chamotte',
    composition: { Al2O3: 45.0, SiO2: 48.0, CaO: 1.5, Fe2O3: 3.5, MgO: 0.8, TiO2: 1.2 },
    rho_true_after_firing_kgm3: 2650,
    availableParticleSizes: ['COARSE_10_6', 'COARSE_6_3', 'MEDIUM_3_1', 'FINE_1_01', 'FINE_06_004', 'MIXED_6_004'],
    thermalProperties: {
      thermalConductivity_WmK: 1.5,
      specificHeat_JkgK: 850,
      thermalExpansion_perK: 5.5e-6,
    },
    mechanicalProperties: {
      crushingStrength_MPa: 80,
      modulusOfRupture_MPa: 12,
      hardness_HV: 850,
    },
    chemicalShrinkage_volFrac: 0.002,
    activationEnergy_Jmol: 450000,
    meltingPoint_C: 1650,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/chamotte',
    isActive: true,
  },
  {
    materialId: 'chamotte_high_alumina',
    name: 'Chamotte (High Alumina)',
    type: 'aggregate',
    materialGroup: ['silicate', 'oxide'],
    orderNumber: 7,
    description: '60-70% Al2O3, higher refractoriness, bauxitic',
    composition: { Al2O3: 65.0, SiO2: 30.0, CaO: 1.0, Fe2O3: 2.5, MgO: 0.5, TiO2: 1.0 },
    rho_true_after_firing_kgm3: 2850,
    availableParticleSizes: ['COARSE_10_6', 'COARSE_6_3', 'MEDIUM_3_1', 'FINE_1_01', 'FINE_06_004'],
    thermalProperties: {
      thermalConductivity_WmK: 1.8,
      specificHeat_JkgK: 870,
      thermalExpansion_perK: 6.0e-6,
    },
    mechanicalProperties: {
      crushingStrength_MPa: 100,
      modulusOfRupture_MPa: 15,
      hardness_HV: 900,
    },
    chemicalShrinkage_volFrac: 0.002,
    activationEnergy_Jmol: 480000,
    meltingPoint_C: 1720,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/chamotte',
    isActive: true,
  },

  // =================================================================
  // ZIRCONIUM SILICATE
  // =================================================================
  {
    materialId: 'zircon',
    name: 'Zircon (Zirconium Silicate)',
    type: 'aggregate',
    materialGroup: ['silicate', 'oxide'],
    orderNumber: 12,
    description: 'ZrSiO4, excellent thermal shock resistance, low thermal expansion',
    composition: { ZrO2: 67.2, SiO2: 32.8 },
    rho_true_after_firing_kgm3: 4560,
    availableParticleSizes: ['COARSE_6_3', 'MEDIUM_3_1', 'FINE_1_01', 'FINE_03_01'],
    thermalProperties: {
      thermalConductivity_WmK: 3.5,
      specificHeat_JkgK: 590,
      thermalExpansion_perK: 4.2e-6, // Low!
    },
    mechanicalProperties: {
      crushingStrength_MPa: 120,
      youngModulus_GPa: 250,
      hardness_HV: 1200,
    },
    chemicalShrinkage_volFrac: 0.001,
    activationEnergy_Jmol: 550000,
    meltingPoint_C: 2550,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/zircon',
    supplier: 'Imerys / Saint-Gobain',
    isActive: true,
  },

  // =================================================================
  // PURE SILICA
  // =================================================================
  {
    materialId: 'silica_quartz',
    name: 'Quartz Sand',
    type: 'aggregate',
    materialGroup: ['silicate', 'oxide'],
    orderNumber: 6,
    description: 'Crystalline SiO2, common silica aggregate',
    composition: { SiO2: 99.0, Al2O3: 0.3, Fe2O3: 0.2, CaO: 0.2, K2O: 0.2, Na2O: 0.1 },
    rho_true_after_firing_kgm3: 2650,
    availableParticleSizes: ['MEDIUM_1_05', 'MEDIUM_05_02', 'FINE_03_01'],
    thermalProperties: {
      thermalConductivity_WmK: 1.4,
      specificHeat_JkgK: 740,
      thermalExpansion_perK: 14.0e-6, // High thermal expansion!
    },
    mechanicalProperties: {
      crushingStrength_MPa: 60,
      hardness_HV: 700,
    },
    chemicalShrinkage_volFrac: 0.001,
    activationEnergy_Jmol: 500000,
    meltingPoint_C: 1713,
    sourceUrl: 'https://www.sciencedirect.com/topics/engineering/quartz-sand',
    isActive: true,
  },
  {
    materialId: 'silica_fused',
    name: 'Fused Silica',
    type: 'aggregate',
    materialGroup: ['silicate', 'oxide'],
    orderNumber: 10,
    description: 'Amorphous SiO2, very low thermal expansion',
    composition: { SiO2: 99.8, Al2O3: 0.1, Fe2O3: 0.05, CaO: 0.05 },
    rho_true_after_firing_kgm3: 2200,
    availableParticleSizes: ['MEDIUM_05_02', 'FINE_03_01', 'POWDER_015_005'],
    thermalProperties: {
      thermalConductivity_WmK: 1.3,
      specificHeat_JkgK: 740,
      thermalExpansion_perK: 0.5e-6, // Very low thermal expansion!
    },
    mechanicalProperties: {
      crushingStrength_MPa: 50,
      hardness_HV: 600,
    },
    chemicalShrinkage_volFrac: 0.0005,
    activationEnergy_Jmol: 520000,
    meltingPoint_C: 1710,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/fused-silica',
    isActive: true,
  },

  // =================================================================
  // CALCIUM SILICATES
  // =================================================================
  {
    materialId: 'wollastonite',
    name: 'Wollastonite',
    type: 'aggregate',
    materialGroup: ['silicate'],
    orderNumber: 12,
    description: 'CaSiO3, calcium metasilicate',
    composition: { CaO: 48.3, SiO2: 51.7 },
    rho_true_after_firing_kgm3: 2900,
    availableParticleSizes: ['MEDIUM_1_05', 'FINE_03_01', 'POWDER_015_005'],
    thermalProperties: {
      thermalConductivity_WmK: 2.0,
      specificHeat_JkgK: 820,
      thermalExpansion_perK: 6.5e-6,
    },
    mechanicalProperties: {
      hardness_HV: 550,
    },
    chemicalShrinkage_volFrac: 0.001,
    activationEnergy_Jmol: 450000,
    meltingPoint_C: 1540,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/wollastonite',
    isActive: true,
  },

  // =================================================================
  // COMPLEX SILICATES
  // =================================================================
  {
    materialId: 'cordierite',
    name: 'Cordierite',
    type: 'aggregate',
    materialGroup: ['silicate', 'oxide'],
    orderNumber: 13,
    description: '2MgO·2Al2O3·5SiO2, very low thermal expansion',
    composition: { MgO: 13.8, Al2O3: 34.8, SiO2: 51.4 },
    rho_true_after_firing_kgm3: 2520,
    availableParticleSizes: ['MEDIUM_3_1', 'FINE_1_01'],
    thermalProperties: {
      thermalConductivity_WmK: 2.5,
      specificHeat_JkgK: 800,
      thermalExpansion_perK: 2.0e-6, // Very low!
    },
    mechanicalProperties: {
      hardness_HV: 700,
    },
    chemicalShrinkage_volFrac: 0.002,
    activationEnergy_Jmol: 480000,
    meltingPoint_C: 1450,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/cordierite',
    isActive: true,
  },
  {
    materialId: 'nepheline_syenite',
    name: 'Nepheline Syenite',
    type: 'aggregate',
    materialGroup: ['silicate', 'flux'],
    orderNumber: 16,
    description: '(Na,K)AlSiO4, flux and glass former',
    composition: { SiO2: 60.0, Al2O3: 23.0, Na2O: 10.0, K2O: 5.0, CaO: 1.0, Fe2O3: 1.0 },
    rho_true_after_firing_kgm3: 2600,
    availableParticleSizes: ['FINE_03_01', 'POWDER_015_005'],
    thermalProperties: {
      specificHeat_JkgK: 810,
    },
    mechanicalProperties: {
      hardness_HV: 600,
    },
    chemicalShrinkage_volFrac: 0.002,
    activationEnergy_Jmol: 450000,
    meltingPoint_C: 1530,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/nepheline-syenite',
    isActive: true,
  },
  {
    materialId: 'anorthite',
    name: 'Anorthite',
    type: 'aggregate',
    materialGroup: ['silicate'],
    orderNumber: 18,
    description: 'CaAl2Si2O8, calcium feldspar',
    composition: { CaO: 20.2, Al2O3: 36.7, SiO2: 43.1 },
    rho_true_after_firing_kgm3: 2760,
    availableParticleSizes: ['FINE_1_01', 'FINE_03_01'],
    thermalProperties: {
      specificHeat_JkgK: 780,
    },
    mechanicalProperties: {
      hardness_HV: 650,
    },
    chemicalShrinkage_volFrac: 0.001,
    activationEnergy_Jmol: 480000,
    meltingPoint_C: 1553,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/anorthite',
    isActive: true,
  },

  // =================================================================
  // SILICATE MINERALS
  // =================================================================
  {
    materialId: 'mica',
    name: 'Mica (Muscovite)',
    type: 'additive',
    materialGroup: ['silicate'],
    orderNumber: 14,
    description: 'KAl2(AlSi3O10)(OH)2, expansion compensator',
    composition: { Al2O3: 38.5, SiO2: 45.2, K2O: 11.8, H2O: 4.5 },
    rho_true_after_firing_kgm3: 2830,
    availableParticleSizes: ['POWDER_015_005'],
    thermalProperties: {
      specificHeat_JkgK: 880,
    },
    mechanicalProperties: {
      hardness_HV: 300, // Soft, flaky
    },
    chemicalShrinkage_volFrac: 0.05,
    activationEnergy_Jmol: 420000,
    meltingPoint_C: 1280,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/muscovite',
    isActive: true,
  },
  {
    materialId: 'microsilica',
    name: 'Microsilica (Silica Fume)',
    type: 'additive',
    materialGroup: ['silicate', 'oxide'],
    orderNumber: 15,
    description: 'Ultrafine SiO2, pozzolanic additive',
    composition: { SiO2: 95.0, Al2O3: 0.5, Fe2O3: 1.0, CaO: 0.5, MgO: 1.0, K2O: 1.0, Na2O: 1.0 },
    rho_true_after_firing_kgm3: 2200,
    availableParticleSizes: ['ULTRAFINE'],
    thermalProperties: {
      thermalConductivity_WmK: 1.2,
      specificHeat_JkgK: 750,
    },
    mechanicalProperties: {
      hardness_HV: 650,
    },
    chemicalShrinkage_volFrac: 0.01,
    activationEnergy_Jmol: 480000,
    meltingPoint_C: 1700,
    sourceUrl: 'https://www.sciencedirect.com/topics/engineering/silica-fume',
    isActive: true,
  },

  // =================================================================
  // CARBONATES (Convert to silicates on firing)
  // =================================================================
  {
    materialId: 'dolomite',
    name: 'Dolomite',
    type: 'aggregate',
    materialGroup: ['carbonate', 'flux'],
    orderNumber: 10,
    description: 'CaMg(CO3)2, calcium magnesium carbonate',
    composition: { CaO: 30.4, MgO: 21.9, CO2: 47.7 },
    rho_true_after_firing_kgm3: 2850,
    availableParticleSizes: ['MEDIUM_3_1', 'FINE_1_01', 'POWDER_015_005'],
    thermalProperties: {
      specificHeat_JkgK: 920,
    },
    mechanicalProperties: {
      hardness_HV: 400,
    },
    chemicalShrinkage_volFrac: 0.45, // High due to CO2 loss
    activationEnergy_Jmol: 400000,
    meltingPoint_C: 2570,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/dolomite',
    isActive: true,
  },
];

