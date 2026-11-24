import type { CompleteMixFraction } from '../../../src/modules/materials/sections/mineral-compositions/types/complete-mix-fraction.type';

/** Low-cement alumina castable, coarse → fine. */
export const CASTABLE_MIX_FRACTIONS: CompleteMixFraction[] = [
  { id: 'f1', materialId: 'alumina_tabular', sizeKey: 'standard:COARSE_6_3', dMin_mm: 3, dMax_mm: 6, d50_mm: 4.5, massPercent: 35, density_kgm3: 3550, isFixed: false },
  { id: 'f2', materialId: 'alumina_tabular', sizeKey: 'standard:MEDIUM_3_1', dMin_mm: 1, dMax_mm: 3, d50_mm: 2, massPercent: 25, density_kgm3: 3550, isFixed: false },
  { id: 'f3', materialId: 'alumina_calcined', sizeKey: 'standard:FINE_03_01', dMin_mm: 0.1, dMax_mm: 0.3, d50_mm: 0.2, massPercent: 20, density_kgm3: 3900, isFixed: false },
  { id: 'f4', materialId: 'cac_ca70', sizeKey: 'cement:CAC_70_STANDARD', dMin_mm: 0.001, dMax_mm: 0.045, d50_mm: 0.01, massPercent: 15, density_kgm3: 2900, isFixed: true },
  { id: 'f5', materialId: 'alumina_reactive', sizeKey: 'standard:ULTRAFINE', dMin_mm: 0.0005, dMax_mm: 0.005, d50_mm: 0.002, massPercent: 5, density_kgm3: 3950, isFixed: false },
];
