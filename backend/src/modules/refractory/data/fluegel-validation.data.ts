/**
 * Fluegel 2007 — Validation Glass Dataset
 *
 * Compositions in mol% (primary source: Fluegel 2007 Table 1).
 * wt% derived via: wt_i = mol_i × M_i, normalised to 100%.
 * Isokom temperatures at log η = 1.5, 6.6, 12.0 Pa·s (from Table 12).
 *
 * Sources:
 *   shared/sources/fluegel_2007/Fluegel_table1.csv
 *   shared/sources/fluegel_2007/Fluegel_table12.csv
 *
 * Molar masses used — see MOLAR_MASSES in viscosity-parameters.ts.
 *
 * Tolerance: 5°C — Fluegel regression SE is 10–17°C; implementation must
 *   reproduce model output (not experiment) to within 5°C.
 */

import type { GlassValidationEntry } from './interfaces/glass-viscosity-validation.interface';

export const FLUEGEL_VALIDATION_GLASSES: GlassValidationEntry[] = [
  {
    id: 'NIST SRM 710A',
    description: 'Soda-lime-silica glass (high-viscosity reference standard)',
    source: 'Fluegel 2007, Table 1 (mol%) + Table 12',
    composition_mol_pct: { SiO2: 71.43, Al2O3: 1.31, Na2O: 8.25, K2O: 6.27, CaO: 9.62, TiO2: 0.32, ZnO: 2.81 },
    composition_wt_pct:  { SiO2: 67.895, Al2O3: 2.113, Na2O: 8.09, K2O: 9.344, CaO: 8.535, TiO2: 0.404, ZnO: 3.618 },
    isokoms: [
      { logEta: 1.5,  T_model_C: 1314, T_measured_C: 1319 },
      { logEta: 6.6,  T_model_C:  729, T_measured_C:  731 },
      { logEta: 12.0, T_model_C:  551, T_measured_C:  545 },
    ],
    expectedModel: 'FLUEGEL_2007',
    tolerance_model_C: 5.0,
  },
  {
    id: 'NIST SRM 717A',
    description: 'Borosilicate glass (viscosity reference standard)',
    source: 'Fluegel 2007, Table 1 (mol%) + Table 12',
    composition_mol_pct: { SiO2: 72.25, Al2O3: 2.19, Na2O: 1.03, K2O: 5.42, B2O3: 16.97, Li2O: 2.14 },
    composition_wt_pct:  { SiO2: 67.996, Al2O3: 3.498, Na2O: 1.0, K2O: 7.998, B2O3: 18.507, Li2O: 1.002 },
    isokoms: [
      { logEta: 1.5,  T_model_C: 1378, T_measured_C: 1388 },
      { logEta: 6.6,  T_model_C:  731, T_measured_C:  719 },
      { logEta: 12.0, T_model_C:  520, T_measured_C:  514 },
    ],
    expectedModel: 'FLUEGEL_2007',
    tolerance_model_C: 5.0,
  },
  {
    id: 'NIST SRM 711',
    description: 'Lead silicate glass (viscosity reference standard)',
    source: 'Fluegel 2007, Table 1 (mol%) + Table 12',
    composition_mol_pct: { SiO2: 71.28, Al2O3: 0.51, Na2O: 3.76, K2O: 5.55, PbO: 18.9 },
    composition_wt_pct:  { SiO2: 46.005, Al2O3: 0.559, Na2O: 2.503, K2O: 5.616, PbO: 45.317 },
    isokoms: [
      { logEta: 1.5,  T_model_C: 1172, T_measured_C: 1185 },
      { logEta: 6.6,  T_model_C:  614, T_measured_C:  614 },
      { logEta: 12.0, T_model_C:  445, T_measured_C:  443 },
    ],
    expectedModel: 'FLUEGEL_2007',
    tolerance_model_C: 5.0,
  },
  {
    id: 'NIST SRM 710',
    description: 'Soda-lime-silica glass (standard viscosity reference)',
    source: 'Fluegel 2007, Table 1 (mol%) + Table 12',
    composition_mol_pct: { SiO2: 72.74, Al2O3: 0.11, Na2O: 8.7, K2O: 5.07, CaO: 12.82, Fe2O3: 0.01 },
    composition_wt_pct:  { SiO2: 71.423, Al2O3: 0.183, Na2O: 8.813, K2O: 7.805, CaO: 11.75, Fe2O3: 0.026 },
    isokoms: [
      { logEta: 1.5,  T_model_C: 1294, T_measured_C: 1293 },
      { logEta: 6.6,  T_model_C:  732, T_measured_C:  725 },
      { logEta: 12.0, T_model_C:  564, T_measured_C:  556 },
    ],
    expectedModel: 'FLUEGEL_2007',
    tolerance_model_C: 5.0,
  },
  {
    id: 'DGG-I (Fluegel)',
    description: 'Soda-lime-silica float glass (DGG-I reference composition)',
    source: 'Fluegel 2007, Table 1 (mol%) + Table 12',
    composition_mol_pct: { SiO2: 70.94, Al2O3: 0.72, Na2O: 14.34, K2O: 0.21, MgO: 6.16, CaO: 7.13, SO3: 0.32, Fe2O3: 0.07, TiO2: 0.1 },
    composition_wt_pct:  { SiO2: 71.789, Al2O3: 1.237, Na2O: 14.971, K2O: 0.333, MgO: 4.181, CaO: 6.735, SO3: 0.432, Fe2O3: 0.188, TiO2: 0.135 },
    isokoms: [
      { logEta: 1.5,  T_model_C: 1303, T_measured_C: 1301 },
      { logEta: 6.6,  T_model_C:  715, T_measured_C:  721 },
      { logEta: 12.0, T_model_C:  535, T_measured_C:  539 },
    ],
    expectedModel: 'FLUEGEL_2007',
    tolerance_model_C: 5.0,
  },
];

