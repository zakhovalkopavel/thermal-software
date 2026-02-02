/**
 * Binder Materials
 *
 * Cement and binding agents for refractory castables and plastics
 * All binders have specific particle size distributions
 */

import { MaterialEntry } from '../interfaces/material.interface';

export const BINDER_MATERIALS: MaterialEntry[] = [
  {
    materialId: 'cac_ca70',
    name: 'Calcium Aluminate Cement (CA-70)',
    type: 'binder',
    materialGroup: ['binder', 'oxide'],
    orderNumber: 6,
    description: '70% Al2O3, common high-alumina cement for castables',
    composition: { Al2O3: 70.0, CaO: 28.0, SiO2: 0.5, Fe2O3: 0.5, MgO: 0.5, TiO2: 0.5 },
    rho_true_after_firing_kgm3: 3200,
    particleSize: { dMin_mm: 0.001, dMax_mm: 0.1, d50_mm: 0.015 },
    thermalProperties: {
      thermalConductivity_WmK: 2.5,
      specificHeat_JkgK: 880,
    },
    mechanicalProperties: {
      hardness_HV: 500,
    },
    chemicalShrinkage_volFrac: 0.12,
    activationEnergy_Jmol: 420000,
    meltingPoint_C: 1600,
    sourceUrl: 'https://www.sciencedirect.com/science/article/pii/S0008884616303474',
    supplier: 'Kerneos / Imerys',
    isActive: true,
  },
  {
    materialId: 'cac_ca80',
    name: 'Calcium Aluminate Cement (CA-80)',
    type: 'binder',
    materialGroup: ['binder', 'oxide'],
    orderNumber: 8,
    description: '80% Al2O3, higher refractoriness than CA-70',
    composition: { Al2O3: 80.0, CaO: 18.0, SiO2: 0.5, Fe2O3: 0.5, MgO: 0.5, TiO2: 0.5 },
    rho_true_after_firing_kgm3: 3300,
    particleSize: { dMin_mm: 0.001, dMax_mm: 0.1, d50_mm: 0.012 },
    thermalProperties: {
      thermalConductivity_WmK: 2.8,
      specificHeat_JkgK: 880,
    },
    mechanicalProperties: {
      hardness_HV: 550,
    },
    chemicalShrinkage_volFrac: 0.11,
    activationEnergy_Jmol: 440000,
    meltingPoint_C: 1650,
    sourceUrl: 'https://www.sciencedirect.com/science/article/pii/S0008884616303474',
    supplier: 'Kerneos / Imerys',
    isActive: true,
  },
  {
    materialId: 'fondu',
    name: 'Ciment Fondu',
    type: 'binder',
    materialGroup: ['binder', 'oxide'],
    orderNumber: 5,
    description: '38-40% Al2O3, rapid hardening CAC, ultrafine',
    composition: { Al2O3: 39.0, CaO: 38.0, SiO2: 5.0, Fe2O3: 16.0, MgO: 1.0, TiO2: 1.0 },
    rho_true_after_firing_kgm3: 3100,
    particleSize: { dMin_mm: 0.0005, dMax_mm: 0.08, d50_mm: 0.010 },
    thermalProperties: {
      thermalConductivity_WmK: 2.2,
      specificHeat_JkgK: 860,
    },
    mechanicalProperties: {
      hardness_HV: 480,
    },
    chemicalShrinkage_volFrac: 0.14,
    activationEnergy_Jmol: 400000,
    meltingPoint_C: 1535,
    sourceUrl: 'https://www.kerneos.com/en/products/ciment-fondu/',
    supplier: 'Kerneos',
    isActive: true,
  },
  {
    materialId: 'cement_pc',
    name: 'Portland Cement (OPC)',
    type: 'binder',
    materialGroup: ['binder', 'silicate'],
    orderNumber: 1,
    description: 'Ordinary Portland cement, limited use in refractories',
    composition: { CaO: 63.0, SiO2: 20.0, Al2O3: 6.0, Fe2O3: 3.0, MgO: 2.5, SO3: 2.5, K2O: 1.0, Na2O: 1.0, TiO2: 1.0 },
    rho_true_after_firing_kgm3: 3150,
    particleSize: { dMin_mm: 0.001, dMax_mm: 0.1, d50_mm: 0.020 },
    thermalProperties: {
      thermalConductivity_WmK: 1.7,
      specificHeat_JkgK: 880,
    },
    mechanicalProperties: {
      hardness_HV: 350,
    },
    chemicalShrinkage_volFrac: 0.064,
    activationEnergy_Jmol: 380000,
    meltingPoint_C: 1450,
    sourceUrl: 'https://www.sciencedirect.com/science/article/pii/S0950061814006200',
    isActive: true,
  },
];

