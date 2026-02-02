/**
 * Oxide Materials
 *
 * Pure oxide ceramics and oxide-based aggregates
 * Materials that are PRIMARILY oxides (even if they have multiple groups)
 */

import { MaterialEntry } from '../interfaces/material.interface';

export const OXIDE_MATERIALS: MaterialEntry[] = [

  // =================================================================
  // ALUMINA
  // =================================================================
  {
    materialId: 'alumina_tabular',
    name: 'Tabular Alumina',
    type: 'aggregate',
    materialGroup: ['oxide'],
    orderNumber: 9,
    description: '99.5% Al2O3, high purity sintered alumina, low porosity',
    composition: { Al2O3: 99.5, SiO2: 0.1, CaO: 0.1, Fe2O3: 0.1, Na2O: 0.2 },
    rho_true_after_firing_kgm3: 3950,
    availableParticleSizes: ['COARSE_6_3', 'MEDIUM_3_1', 'FINE_1_01'],
    thermalProperties: {
      thermalConductivity_WmK: 30.0,
      specificHeat_JkgK: 880,
      thermalExpansion_perK: 8.0e-6,
    },
    mechanicalProperties: {
      crushingStrength_MPa: 200,
      modulusOfRupture_MPa: 25,
      youngModulus_GPa: 380,
      hardness_HV: 1800,
    },
    chemicalShrinkage_volFrac: 0.001,
    activationEnergy_Jmol: 580000,
    meltingPoint_C: 2050,
    sourceUrl: 'https://www.almatis.com/products/tabular-alumina',
    supplier: 'Almatis',
    isActive: true,
  },
  {
    materialId: 'alumina_calcined',
    name: 'Calcined Alumina',
    type: 'aggregate',
    materialGroup: ['oxide'],
    orderNumber: 8,
    description: '99.0-99.8% Al2O3, reactive calcined alumina',
    composition: { Al2O3: 99.0, SiO2: 0.2, CaO: 0.2, Fe2O3: 0.15, Na2O: 0.45 },
    rho_true_after_firing_kgm3: 3900,
    availableParticleSizes: ['MEDIUM_3_1', 'MEDIUM_1_05', 'FINE_03_01', 'POWDER_015_005'],
    thermalProperties: {
      thermalConductivity_WmK: 28.0,
      specificHeat_JkgK: 870,
      thermalExpansion_perK: 7.8e-6,
    },
    mechanicalProperties: {
      crushingStrength_MPa: 180,
      hardness_HV: 1700,
    },
    chemicalShrinkage_volFrac: 0.003,
    activationEnergy_Jmol: 560000,
    meltingPoint_C: 2050,
    sourceUrl: 'https://www.almatis.com/products/calcined-alumina',
    supplier: 'Almatis',
    isActive: true,
  },
  {
    materialId: 'alumina_reactive',
    name: 'Reactive Alumina',
    type: 'additive',
    materialGroup: ['oxide'],
    orderNumber: 16,
    description: 'Ultrafine Al2O3, high sintering activity, reactive powder',
    composition: { Al2O3: 99.0, SiO2: 0.2, CaO: 0.2, Fe2O3: 0.1, Na2O: 0.5 },
    rho_true_after_firing_kgm3: 3850,
    availableParticleSizes: ['ULTRAFINE'],
    thermalProperties: {
      thermalConductivity_WmK: 25.0,
      specificHeat_JkgK: 850,
    },
    mechanicalProperties: {
      hardness_HV: 1650,
    },
    chemicalShrinkage_volFrac: 0.015,
    activationEnergy_Jmol: 520000,
    meltingPoint_C: 2050,
    sourceUrl: 'https://www.sciencedirect.com/topics/chemistry/reactive-alumina',
    isActive: true,
  },

  // =================================================================
  // MAGNESIA
  // =================================================================
  {
    materialId: 'magnesia_dead_burned',
    name: 'Dead Burned Magnesia (DBM)',
    type: 'aggregate',
    materialGroup: ['oxide'],
    orderNumber: 11,
    description: '95-98% MgO, highly sintered periclase',
    composition: { MgO: 97.0, CaO: 1.5, SiO2: 0.8, Fe2O3: 0.4, Al2O3: 0.3 },
    rho_true_after_firing_kgm3: 3550,
    availableParticleSizes: ['COARSE_6_3', 'MEDIUM_3_1', 'FINE_1_01'],
    thermalProperties: {
      thermalConductivity_WmK: 40.0,
      specificHeat_JkgK: 940,
      thermalExpansion_perK: 13.5e-6,
    },
    mechanicalProperties: {
      hardness_HV: 600,
    },
    chemicalShrinkage_volFrac: 0.001,
    activationEnergy_Jmol: 620000,
    meltingPoint_C: 2800,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/magnesia',
    isActive: true,
  },
  {
    materialId: 'magnesia_fused',
    name: 'Fused Magnesia',
    type: 'aggregate',
    materialGroup: ['oxide'],
    orderNumber: 13,
    description: '98-99% MgO, electrically fused periclase',
    composition: { MgO: 98.5, CaO: 0.8, SiO2: 0.4, Fe2O3: 0.2, Al2O3: 0.1 },
    rho_true_after_firing_kgm3: 3580,
    availableParticleSizes: ['COARSE_6_3', 'MEDIUM_3_1', 'FINE_1_01'],
    thermalProperties: {
      thermalConductivity_WmK: 45.0,
      specificHeat_JkgK: 940,
      thermalExpansion_perK: 13.0e-6,
    },
    mechanicalProperties: {
      hardness_HV: 650,
    },
    chemicalShrinkage_volFrac: 0.0005,
    activationEnergy_Jmol: 650000,
    meltingPoint_C: 2850,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/fused-magnesia',
    isActive: true,
  },

  // =================================================================
  // SPINEL
  // =================================================================
  {
    materialId: 'spinel_synthetic',
    name: 'Synthetic Spinel',
    type: 'aggregate',
    materialGroup: ['oxide'],
    orderNumber: 14,
    description: 'MgO·Al2O3, magnesium aluminate spinel',
    composition: { MgO: 28.0, Al2O3: 72.0 },
    rho_true_after_firing_kgm3: 3580,
    availableParticleSizes: ['MEDIUM_3_1', 'FINE_1_01', 'FINE_03_01'],
    thermalProperties: {
      thermalConductivity_WmK: 15.0,
      specificHeat_JkgK: 900,
      thermalExpansion_perK: 7.6e-6,
    },
    mechanicalProperties: {
      hardness_HV: 1500,
    },
    chemicalShrinkage_volFrac: 0.001,
    activationEnergy_Jmol: 550000,
    meltingPoint_C: 2135,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/spinel',
    isActive: true,
  },

  // =================================================================
  // ZIRCONIA & ZIRCON
  // =================================================================
  {
    materialId: 'zirconia_stabilized',
    name: 'Zirconia (Yttria-Stabilized)',
    type: 'aggregate',
    materialGroup: ['oxide'],
    orderNumber: 15,
    description: 'ZrO2 + 3-8% Y2O3, cubic/tetragonal, high fracture toughness',
    composition: { ZrO2: 94.5, Y2O3: 5.5 },
    rho_true_after_firing_kgm3: 6050,
    availableParticleSizes: ['MEDIUM_3_1', 'FINE_1_01', 'FINE_03_01', 'POWDER_015_005'],
    thermalProperties: {
      thermalConductivity_WmK: 2.5,
      specificHeat_JkgK: 460,
      thermalExpansion_perK: 10.5e-6,
    },
    mechanicalProperties: {
      crushingStrength_MPa: 250,
      youngModulus_GPa: 210,
      hardness_HV: 1200,
    },
    chemicalShrinkage_volFrac: 0.002,
    activationEnergy_Jmol: 580000,
    meltingPoint_C: 2715,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/stabilized-zirconia',
    supplier: 'Tosoh / Daiichi Kigenso',
    isActive: true,
  },

  // =================================================================
  // RARE EARTH OXIDES
  // =================================================================
  {
    materialId: 'lanthanum_oxide',
    name: 'Lanthanum Oxide',
    type: 'additive',
    materialGroup: ['oxide', 'rare_earth'],
    orderNumber: 22,
    description: 'La2O3, high melting point, glass modifier',
    composition: { La2O3: 99.5, CeO2: 0.3, Nd2O3: 0.2 },
    rho_true_after_firing_kgm3: 6510,
    availableParticleSizes: ['POWDER_015_005', 'ULTRAFINE'],
    thermalProperties: {
      thermalConductivity_WmK: 4.5,
      specificHeat_JkgK: 430,
      thermalExpansion_perK: 9.1e-6,
    },
    mechanicalProperties: {
      hardness_HV: 600,
    },
    chemicalShrinkage_volFrac: 0.003,
    activationEnergy_Jmol: 520000,
    meltingPoint_C: 2315,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/lanthanum-oxide',
    supplier: 'Molycorp / China Northern Rare Earth',
    isActive: true,
  },
  {
    materialId: 'cerium_oxide',
    name: 'Cerium Oxide (Ceria)',
    type: 'additive',
    materialGroup: ['oxide', 'rare_earth'],
    orderNumber: 23,
    description: 'CeO2, oxygen storage, polishing compound, catalyst',
    composition: { CeO2: 99.0, La2O3: 0.5, Nd2O3: 0.3, Pr6O11: 0.2 },
    rho_true_after_firing_kgm3: 7220,
    availableParticleSizes: ['POWDER_015_005', 'ULTRAFINE'],
    thermalProperties: {
      thermalConductivity_WmK: 12.0,
      specificHeat_JkgK: 400,
      thermalExpansion_perK: 11.0e-6,
    },
    mechanicalProperties: {
      hardness_HV: 650,
    },
    chemicalShrinkage_volFrac: 0.002,
    activationEnergy_Jmol: 510000,
    meltingPoint_C: 2400,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/cerium-oxide',
    supplier: 'Rhodia / BASF',
    isActive: true,
  },

  // =================================================================
  // TRANSITION METAL OXIDES
  // =================================================================
  {
    materialId: 'iron_oxide_fe2o3',
    name: 'Iron Oxide (Hematite)',
    type: 'additive',
    materialGroup: ['oxide', 'flux'],
    orderNumber: 8,
    description: 'Fe2O3, red iron oxide, colorant, flux',
    composition: { Fe2O3: 99.0, SiO2: 0.5, Al2O3: 0.3, MnO: 0.2 },
    rho_true_after_firing_kgm3: 5240,
    availableParticleSizes: ['FINE_03_01', 'POWDER_015_005', 'ULTRAFINE'],
    thermalProperties: {
      thermalConductivity_WmK: 8.0,
      specificHeat_JkgK: 650,
      thermalExpansion_perK: 13.0e-6,
    },
    mechanicalProperties: {
      hardness_HV: 550,
    },
    chemicalShrinkage_volFrac: 0.002,
    activationEnergy_Jmol: 420000,
    meltingPoint_C: 1565,
    sourceUrl: 'https://www.sciencedirect.com/topics/chemistry/hematite',
    isActive: true,
  },
  {
    materialId: 'chromium_oxide',
    name: 'Chromium Oxide',
    type: 'additive',
    materialGroup: ['oxide'],
    orderNumber: 18,
    description: 'Cr2O3, green pigment, wear resistant',
    composition: { Cr2O3: 99.0, Fe2O3: 0.5, Al2O3: 0.3, SiO2: 0.2 },
    rho_true_after_firing_kgm3: 5220,
    availableParticleSizes: ['FINE_03_01', 'POWDER_015_005'],
    thermalProperties: {
      thermalConductivity_WmK: 15.0,
      specificHeat_JkgK: 750,
      thermalExpansion_perK: 7.3e-6,
    },
    mechanicalProperties: {
      youngModulus_GPa: 265,
      hardness_HV: 1500,
    },
    chemicalShrinkage_volFrac: 0.001,
    activationEnergy_Jmol: 520000,
    meltingPoint_C: 2435,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/chromium-oxide',
    isActive: true,
  },

  // =================================================================
  // MANGANESE OXIDES
  // =================================================================
  {
    materialId: 'manganese_dioxide',
    name: 'Manganese Dioxide',
    type: 'additive',
    materialGroup: ['oxide', 'flux'],
    orderNumber: 19,
    description: 'MnO2, oxidizer, brown-black pigment',
    composition: { MnO2: 98.0, MnO: 1.0, Fe2O3: 0.5, SiO2: 0.5 },
    rho_true_after_firing_kgm3: 5030,
    availableParticleSizes: ['POWDER_015_005', 'ULTRAFINE'],
    thermalProperties: {
      thermalConductivity_WmK: 7.0,
      specificHeat_JkgK: 600,
      thermalExpansion_perK: 12.0e-6,
    },
    mechanicalProperties: {
      hardness_HV: 400,
    },
    chemicalShrinkage_volFrac: 0.003,
    activationEnergy_Jmol: 400000,
    meltingPoint_C: 535,
    sourceUrl: 'https://www.sciencedirect.com/topics/chemistry/manganese-dioxide',
    isActive: true,
  },
  {
    materialId: 'manganese_monoxide',
    name: 'Manganese Monoxide (Manganosite)',
    type: 'additive',
    materialGroup: ['oxide'],
    orderNumber: 20,
    description: 'MnO, green color, basic oxide',
    composition: { MnO: 98.5, MnO2: 1.0, Fe2O3: 0.3, SiO2: 0.2 },
    rho_true_after_firing_kgm3: 5370,
    availableParticleSizes: ['POWDER_015_005'],
    thermalProperties: {
      thermalConductivity_WmK: 6.5,
      specificHeat_JkgK: 620,
      thermalExpansion_perK: 11.5e-6,
    },
    mechanicalProperties: {
      hardness_HV: 450,
    },
    chemicalShrinkage_volFrac: 0.002,
    activationEnergy_Jmol: 410000,
    meltingPoint_C: 1945,
    sourceUrl: 'https://www.sciencedirect.com/topics/chemistry/manganese-oxide',
    isActive: true,
  },
  {
    materialId: 'manganese_sesquioxide',
    name: 'Manganese Sesquioxide',
    type: 'additive',
    materialGroup: ['oxide'],
    orderNumber: 21,
    description: 'Mn2O3, black pigment, intermediate oxidation state',
    composition: { Mn2O3: 98.0, MnO2: 1.5, MnO: 0.3, Fe2O3: 0.2 },
    rho_true_after_firing_kgm3: 4500,
    availableParticleSizes: ['POWDER_015_005'],
    thermalProperties: {
      thermalConductivity_WmK: 6.8,
      specificHeat_JkgK: 610,
      thermalExpansion_perK: 11.8e-6,
    },
    mechanicalProperties: {
      hardness_HV: 420,
    },
    chemicalShrinkage_volFrac: 0.002,
    activationEnergy_Jmol: 405000,
    meltingPoint_C: 940,
    sourceUrl: 'https://www.sciencedirect.com/topics/chemistry/manganese-oxide',
    isActive: true,
  },

  // =================================================================
  // TITANIUM & BORON OXIDES
  // =================================================================
  {
    materialId: 'rutile',
    name: 'Rutile',
    type: 'additive',
    materialGroup: ['oxide'],
    orderNumber: 17,
    description: 'TiO2, titanium dioxide',
    composition: { TiO2: 98.0, Fe2O3: 1.0, Al2O3: 0.5, SiO2: 0.5 },
    rho_true_after_firing_kgm3: 4250,
    availableParticleSizes: ['POWDER_015_005', 'ULTRAFINE'],
    thermalProperties: {
      thermalConductivity_WmK: 8.5,
      specificHeat_JkgK: 680,
    },
    mechanicalProperties: {
      hardness_HV: 900,
    },
    chemicalShrinkage_volFrac: 0.001,
    activationEnergy_Jmol: 500000,
    meltingPoint_C: 1843,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/rutile',
    isActive: true,
  },
  {
    materialId: 'ilmenite',
    name: 'Ilmenite',
    type: 'additive',
    materialGroup: ['oxide'],
    orderNumber: 19,
    description: 'FeTiO3, iron titanate',
    composition: { TiO2: 52.7, FeO: 47.3 },
    rho_true_after_firing_kgm3: 4720,
    availableParticleSizes: ['FINE_03_01', 'POWDER_015_005'],
    thermalProperties: {
      thermalConductivity_WmK: 7.0,
      specificHeat_JkgK: 640,
    },
    mechanicalProperties: {
      hardness_HV: 550,
    },
    chemicalShrinkage_volFrac: 0.001,
    activationEnergy_Jmol: 480000,
    meltingPoint_C: 1365,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/ilmenite',
    isActive: true,
  },
  {
    materialId: 'boric_oxide',
    name: 'Boric Oxide (Boron Trioxide)',
    type: 'additive',
    materialGroup: ['oxide', 'flux', 'glass_former'],
    orderNumber: 9,
    description: 'B2O3, glass former, flux, lowers melting point',
    composition: { B2O3: 99.5, H2O: 0.5 },
    rho_true_after_firing_kgm3: 2550,
    availableParticleSizes: ['POWDER_015_005', 'ULTRAFINE'],
    thermalProperties: {
      thermalConductivity_WmK: 0.8,
      specificHeat_JkgK: 1200,
      thermalExpansion_perK: 15.0e-6,
    },
    mechanicalProperties: {
      hardness_HV: 300,
    },
    chemicalShrinkage_volFrac: 0.005,
    activationEnergy_Jmol: 380000,
    meltingPoint_C: 450,
    sourceUrl: 'https://www.sciencedirect.com/topics/chemistry/boron-oxide',
    isActive: true,
  },

  // =================================================================
  // CHROMITE
  // =================================================================
  {
    materialId: 'chromite',
    name: 'Chromite',
    type: 'aggregate',
    materialGroup: ['oxide'],
    orderNumber: 15,
    description: 'FeCr2O4, chromium iron oxide',
    composition: { Cr2O3: 46.0, FeO: 24.0, Al2O3: 15.0, MgO: 10.0, SiO2: 5.0 },
    rho_true_after_firing_kgm3: 4500,
    availableParticleSizes: ['COARSE_6_3', 'MEDIUM_3_1', 'FINE_1_01'],
    thermalProperties: {
      thermalConductivity_WmK: 3.5,
      specificHeat_JkgK: 730,
      thermalExpansion_perK: 9.0e-6,
    },
    mechanicalProperties: {
      hardness_HV: 1100,
    },
    chemicalShrinkage_volFrac: 0.001,
    activationEnergy_Jmol: 520000,
    meltingPoint_C: 2180,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/chromite',
    isActive: true,
  },

  // =================================================================
  // SODIUM & ALUMINUM OXIDES
  // =================================================================
  {
    materialId: 'sodium_aluminate',
    name: 'Sodium Aluminate',
    type: 'additive',
    materialGroup: ['oxide', 'flux'],
    orderNumber: 41,
    description: 'NaAlO2, flux, accelerator for cements',
    composition: { Na2O: 47.6, Al2O3: 52.4 },
    rho_true_after_firing_kgm3: 2500,
    availableParticleSizes: ['POWDER_015_005'],
    thermalProperties: {
      thermalConductivity_WmK: 2.5,
      specificHeat_JkgK: 900,
    },
    mechanicalProperties: {
      hardness_HV: 400,
    },
    chemicalShrinkage_volFrac: 0.003,
    activationEnergy_Jmol: 380000,
    meltingPoint_C: 1650,
    sourceUrl: 'https://www.sciencedirect.com/topics/chemistry/sodium-aluminate',
    isActive: true,
  },
  {
    materialId: 'beta_alumina',
    name: 'Beta-Alumina',
    type: 'aggregate',
    materialGroup: ['oxide'],
    orderNumber: 42,
    description: 'Na2O·11Al2O3, sodium ion conductor',
    composition: { Na2O: 8.2, Al2O3: 91.8 },
    rho_true_after_firing_kgm3: 3240,
    availableParticleSizes: ['POWDER_015_005'],
    thermalProperties: {
      thermalConductivity_WmK: 3.0,
      specificHeat_JkgK: 880,
      thermalExpansion_perK: 7.5e-6,
    },
    mechanicalProperties: {
      hardness_HV: 1200,
    },
    chemicalShrinkage_volFrac: 0.002,
    activationEnergy_Jmol: 520000,
    meltingPoint_C: 2020,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/beta-alumina',
    isActive: true,
  },
  {
    materialId: 'rutile',
    name: 'Rutile',
    type: 'additive',
    materialGroup: ['oxide'],
    orderNumber: 17,
    description: 'TiO2, titanium dioxide',
    composition: { TiO2: 98.0, Fe2O3: 1.0, Al2O3: 0.5, SiO2: 0.5 },
    rho_true_after_firing_kgm3: 4250,
    availableParticleSizes: ['POWDER_015_005', 'ULTRAFINE'],
    thermalProperties: {
      thermalConductivity_WmK: 8.5,
      specificHeat_JkgK: 680,
    },
    mechanicalProperties: {
      hardness_HV: 900,
    },
    chemicalShrinkage_volFrac: 0.001,
    activationEnergy_Jmol: 500000,
    meltingPoint_C: 1843,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/rutile',
    isActive: true,
  },
  {
    materialId: 'ilmenite',
    name: 'Ilmenite',
    type: 'additive',
    materialGroup: ['oxide'],
    orderNumber: 19,
    description: 'FeTiO3, iron titanate',
    composition: { TiO2: 52.7, FeO: 47.3 },
    rho_true_after_firing_kgm3: 4720,
    availableParticleSizes: ['FINE_03_01', 'POWDER_015_005'],
    thermalProperties: {
      thermalConductivity_WmK: 7.0,
      specificHeat_JkgK: 640,
    },
    mechanicalProperties: {
      hardness_HV: 550,
    },
    chemicalShrinkage_volFrac: 0.001,
    activationEnergy_Jmol: 480000,
    meltingPoint_C: 1365,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/ilmenite',
    isActive: true,
  },
];

