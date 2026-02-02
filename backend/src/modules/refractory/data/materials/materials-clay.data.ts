/**
 * Clay Materials
 *
 * Natural clay minerals for refractories and ceramics
 * All clays contain water and shrink significantly on firing
 */

import { MaterialEntry } from '../interfaces/material.interface';

export const CLAY_MATERIALS: MaterialEntry[] = [
  {
    materialId: 'kaolinite',
    name: 'Kaolinite (China Clay)',
    type: 'clay',
    materialGroup: ['clay', 'silicate'],
    orderNumber: 2,
    description: 'Al2Si2O5(OH)4, pure white kaolin clay',
    composition: { Al2O3: 39.5, SiO2: 46.5, H2O: 14.0 },
    rho_true_after_firing_kgm3: 2600,
    availableParticleSizes: ['POWDER_015_005', 'ULTRAFINE'],
    thermalProperties: {
      specificHeat_JkgK: 900,
    },
    mechanicalProperties: {
      hardness_HV: 200, // Soft when unfired
    },
    chemicalShrinkage_volFrac: 0.10, // High shrinkage due to water loss
    activationEnergy_Jmol: 400000,
    meltingPoint_C: 1750,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/kaolinite',
    isActive: true,
  },
  {
    materialId: 'bentonite',
    name: 'Bentonite',
    type: 'clay',
    materialGroup: ['clay', 'silicate'],
    orderNumber: 3,
    description: 'Montmorillonite clay, binder and plasticizer',
    composition: { Al2O3: 20.0, SiO2: 65.0, MgO: 3.0, CaO: 2.0, Na2O: 2.5, H2O: 7.5 },
    rho_true_after_firing_kgm3: 2500,
    availableParticleSizes: ['ULTRAFINE'],
    thermalProperties: {
      specificHeat_JkgK: 950,
    },
    mechanicalProperties: {
      hardness_HV: 150, // Very soft
    },
    chemicalShrinkage_volFrac: 0.12,
    activationEnergy_Jmol: 380000,
    meltingPoint_C: 1300,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/bentonite',
    isActive: true,
  },
  {
    materialId: 'red_clay',
    name: 'Red Clay',
    type: 'clay',
    materialGroup: ['clay', 'silicate'],
    orderNumber: 1,
    description: 'Iron-rich clay, economical',
    composition: { Al2O3: 18.0, SiO2: 60.0, Fe2O3: 8.0, CaO: 5.0, MgO: 3.0, K2O: 3.0, TiO2: 1.0, H2O: 2.0 },
    rho_true_after_firing_kgm3: 2400,
    availableParticleSizes: ['FINE_03_01', 'POWDER_015_005'],
    thermalProperties: {
      specificHeat_JkgK: 920,
    },
    mechanicalProperties: {
      hardness_HV: 300,
    },
    chemicalShrinkage_volFrac: 0.08,
    activationEnergy_Jmol: 360000,
    meltingPoint_C: 1150,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/red-clay',
    isActive: true,
  },
  {
    materialId: 'fireclay',
    name: 'Fireclay',
    type: 'clay',
    materialGroup: ['clay', 'silicate'],
    orderNumber: 3,
    description: '25-45% Al2O3, refractory clay',
    composition: { Al2O3: 35.0, SiO2: 55.0, Fe2O3: 2.0, CaO: 1.0, MgO: 1.0, K2O: 2.0, TiO2: 1.5, H2O: 2.5 },
    rho_true_after_firing_kgm3: 2550,
    availableParticleSizes: ['FINE_05_01', 'FINE_03_01', 'POWDER_015_005'],
    thermalProperties: {
      specificHeat_JkgK: 880,
    },
    mechanicalProperties: {
      hardness_HV: 400,
    },
    chemicalShrinkage_volFrac: 0.06,
    activationEnergy_Jmol: 410000,
    meltingPoint_C: 1600,
    sourceUrl: 'https://www.sciencedirect.com/topics/materials-science/fireclay',
    isActive: true,
  },
  {
    materialId: 'yellow_clay',
    name: 'Yellow Clay (Natural Forest Clay)',
    type: 'clay',
    materialGroup: ['clay', 'silicate'],
    orderNumber: 2,
    description: 'Natural secondary clay, iron and organic content, found in forests',
    composition: { Al2O3: 20.0, SiO2: 58.0, Fe2O3: 5.0, CaO: 3.5, MgO: 2.5, K2O: 2.8, TiO2: 0.8, Organic: 4.0, H2O: 3.4 },
    rho_true_after_firing_kgm3: 2380,
    availableParticleSizes: ['FINE_03_01', 'POWDER_015_005'],
    thermalProperties: {
      thermalConductivity_WmK: 1.0,
      specificHeat_JkgK: 910,
      thermalExpansion_perK: 6.2e-6,
    },
    mechanicalProperties: {
      hardness_HV: 310,
    },
    chemicalShrinkage_volFrac: 0.10, // High due to organic content burnout and water loss
    activationEnergy_Jmol: 365000,
    meltingPoint_C: 1130,
    sourceUrl: 'https://digitalfire.com/glossary/natural+clay',
    isActive: true,
  },

  // =================================================================
  // POTTERY CLAYS (Standard ceramic bodies)
  // =================================================================
  {
    materialId: 'ball_clay',
    name: 'Ball Clay',
    type: 'clay',
    materialGroup: ['clay', 'silicate'],
    orderNumber: 5,
    description: 'Highly plastic secondary clay, light firing',
    composition: { Al2O3: 25.0, SiO2: 60.0, Fe2O3: 1.5, CaO: 0.5, MgO: 0.5, K2O: 2.5, TiO2: 1.5, H2O: 8.5 },
    rho_true_after_firing_kgm3: 2400,
    availableParticleSizes: ['POWDER_015_005', 'ULTRAFINE'],
    thermalProperties: {
      thermalConductivity_WmK: 1.1,
      specificHeat_JkgK: 900,
      thermalExpansion_perK: 5.5e-6,
    },
    mechanicalProperties: {
      hardness_HV: 350,
    },
    chemicalShrinkage_volFrac: 0.11, // High plasticity = high shrinkage
    activationEnergy_Jmol: 390000,
    meltingPoint_C: 1250,
    sourceUrl: 'https://digitalfire.com/material/ball+clay',
    isActive: true,
  },
  {
    materialId: 'stoneware_clay',
    name: 'Stoneware Clay',
    type: 'clay',
    materialGroup: ['clay', 'silicate'],
    orderNumber: 6,
    description: 'Medium plastic, fires to dense stoneware',
    composition: { Al2O3: 22.0, SiO2: 63.0, Fe2O3: 2.5, CaO: 1.5, MgO: 1.0, K2O: 3.0, Na2O: 1.0, TiO2: 0.8, H2O: 5.2 },
    rho_true_after_firing_kgm3: 2450,
    availableParticleSizes: ['FINE_03_01', 'POWDER_015_005'],
    thermalProperties: {
      thermalConductivity_WmK: 1.3,
      specificHeat_JkgK: 880,
      thermalExpansion_perK: 5.8e-6,
    },
    mechanicalProperties: {
      hardness_HV: 400,
    },
    chemicalShrinkage_volFrac: 0.08,
    activationEnergy_Jmol: 400000,
    meltingPoint_C: 1200,
    sourceUrl: 'https://digitalfire.com/glossary/stoneware',
    isActive: true,
  },
  {
    materialId: 'porcelain_clay_mix',
    name: 'Porcelain Clay (Standard Mix)',
    type: 'clay',
    materialGroup: ['clay', 'silicate'],
    orderNumber: 7,
    description: 'Kaolin-rich, fires white, translucent at high fire',
    composition: { Al2O3: 35.0, SiO2: 58.0, K2O: 2.5, Na2O: 1.0, Fe2O3: 0.5, TiO2: 0.3, CaO: 0.2, MgO: 0.5, H2O: 2.0 },
    rho_true_after_firing_kgm3: 2500,
    availableParticleSizes: ['FINE_03_01', 'POWDER_015_005'],
    thermalProperties: {
      thermalConductivity_WmK: 1.6,
      specificHeat_JkgK: 870,
      thermalExpansion_perK: 4.5e-6, // Low
    },
    mechanicalProperties: {
      hardness_HV: 500,
    },
    chemicalShrinkage_volFrac: 0.06,
    activationEnergy_Jmol: 420000,
    meltingPoint_C: 1450,
    sourceUrl: 'https://digitalfire.com/glossary/porcelain',
    isActive: true,
  },
  {
    materialId: 'earthenware_clay',
    name: 'Earthenware Clay (Terra Cotta)',
    type: 'clay',
    materialGroup: ['clay', 'silicate'],
    orderNumber: 4,
    description: 'Iron-rich, low-fire, red/orange body',
    composition: { Al2O3: 16.0, SiO2: 58.0, Fe2O3: 6.5, CaO: 6.0, MgO: 2.5, K2O: 3.5, Na2O: 1.5, TiO2: 0.8, H2O: 5.2 },
    rho_true_after_firing_kgm3: 2350,
    availableParticleSizes: ['FINE_03_01', 'POWDER_015_005'],
    thermalProperties: {
      thermalConductivity_WmK: 1.0,
      specificHeat_JkgK: 920,
      thermalExpansion_perK: 6.5e-6,
    },
    mechanicalProperties: {
      hardness_HV: 320,
    },
    chemicalShrinkage_volFrac: 0.09,
    activationEnergy_Jmol: 370000,
    meltingPoint_C: 1050,
    sourceUrl: 'https://digitalfire.com/glossary/earthenware',
    isActive: true,
  },
  {
    materialId: 'paper_clay',
    name: 'Paper Clay',
    type: 'clay',
    materialGroup: ['clay', 'silicate'],
    orderNumber: 8,
    description: 'Clay with paper fiber, excellent workability and dry strength',
    composition: { Al2O3: 20.0, SiO2: 55.0, Fe2O3: 3.0, CaO: 2.0, MgO: 1.5, K2O: 2.5, Fiber: 10.0, H2O: 6.0 },
    rho_true_after_firing_kgm3: 2300,
    availableParticleSizes: ['FINE_03_01', 'POWDER_015_005'],
    thermalProperties: {
      thermalConductivity_WmK: 0.9,
      specificHeat_JkgK: 940,
      thermalExpansion_perK: 6.0e-6,
    },
    mechanicalProperties: {
      hardness_HV: 280,
    },
    chemicalShrinkage_volFrac: 0.12, // High due to fiber burnout
    activationEnergy_Jmol: 350000,
    meltingPoint_C: 1100,
    sourceUrl: 'https://digitalfire.com/glossary/paper+clay',
    isActive: true,
  },
  {
    materialId: 'raku_clay',
    name: 'Raku Clay',
    type: 'clay',
    materialGroup: ['clay', 'silicate'],
    orderNumber: 9,
    description: 'High grog content, thermal shock resistant for raku firing',
    composition: { Al2O3: 24.0, SiO2: 50.0, Fe2O3: 4.0, CaO: 3.0, MgO: 2.0, Grog: 15.0, H2O: 2.0 },
    rho_true_after_firing_kgm3: 2420,
    availableParticleSizes: ['MEDIUM_3_1', 'FINE_1_01', 'FINE_03_01'],
    thermalProperties: {
      thermalConductivity_WmK: 1.2,
      specificHeat_JkgK: 860,
      thermalExpansion_perK: 5.2e-6,
    },
    mechanicalProperties: {
      hardness_HV: 380,
    },
    chemicalShrinkage_volFrac: 0.04, // Low due to grog
    activationEnergy_Jmol: 380000,
    meltingPoint_C: 1180,
    sourceUrl: 'https://digitalfire.com/glossary/raku',
    isActive: true,
  },
];

