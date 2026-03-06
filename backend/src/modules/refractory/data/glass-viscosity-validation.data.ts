/**
 * Glass Viscosity Validation Dataset
 *
 * Reference glasses with BOTH composition formats and measured isokom temperatures.
 * Used by tests — NOT inline in test files.
 *
 * Sources:
 *   Lakatos (1976): Table 1A/1B — compositions in wt%, isokom T from regression
 *     shared/sources/lakatos_ocr/page_003_table_001.csv
 *     shared/sources/lakatos_ocr/page_004_table_002.csv
 *   Fluegel (2007): Table 1 — compositions in MOL%, isokom T from Table 12
 *     shared/sources/fluegel_2007/Fluegel_table1.csv
 *     shared/sources/fluegel_2007/Fluegel_table12.csv
 *
 * For each Fluegel glass:
 *   composition_mol_pct  — primary source (Table 1, mol%)
 *   composition_wt_pct   — derived via mol% → wt% conversion (for service input)
 *   Conversion: wt_i = mol_i * M_i; wt% = wt_i / Σ wt_j * 100
 *   Molar masses used: see MOLAR_MASSES in viscosity-parameters.ts
 *
 * For each Lakatos glass:
 *   composition_wt_pct   — primary source (Table 1A/1B, wt%)
 *   isokom T at log η = 1, 3, 5 Pa·s (= log poise 2, 4, 6) — model regression output
 */

import type { GlassIsokomPoint, GlassValidationEntry } from './interfaces/glass-viscosity-validation.interface';
export type { GlassIsokomPoint, GlassValidationEntry };

// ─── LAKATOS 1976 — wt% compositions (primary source) ─────────────────────────
// Isokom levels: log η = 1, 3, 5 Pa·s  (= log poise 2, 4, 6)
// Tolerance: 1°C — implementation must reproduce the regression exactly.

export const LAKATOS_VALIDATION_GLASSES: GlassValidationEntry[] = [
  {
    id: 'S1',
    description: 'Soda-lime container glass, high SiO₂',
    source: 'Lakatos 1976, Table 1A, series S',
    composition_wt_pct: { SiO2: 77.02, Al2O3: 0.19, Na2O: 12.03, K2O: 0.13, CaO: 10.12 },
    isokoms: [
      { logEta: 1, T_model_C: 1503.7, T_measured_C: 1503.7 + 5.3 },
      { logEta: 3, T_model_C: 1054.3, T_measured_C: 1054.3 + 4.8 },
      { logEta: 5, T_model_C:  843.3, T_measured_C:  843.3 + 5.4 },
    ],
    expectedModel: 'LAKATOS_1976',
    tolerance_model_C: 1.0,
  },
  {
    id: 'S7',
    description: 'Standard window glass',
    source: 'Lakatos 1976, Table 1A, series S',
    composition_wt_pct: { SiO2: 71.41, Al2O3: 2.21, Na2O: 12.44, K2O: 2.6, CaO: 10.1, MgO: 0.77 },
    isokoms: [
      { logEta: 1, T_model_C: 1465.9, T_measured_C: 1465.9 + 2.9 },
      { logEta: 3, T_model_C: 1034.0, T_measured_C: 1034.0 + 2.1 },
      { logEta: 5, T_model_C:  829.9, T_measured_C:  829.9 + 2.5 },
    ],
    expectedModel: 'LAKATOS_1976',
    tolerance_model_C: 1.0,
  },
  {
    id: 'S16',
    description: 'High Na₂O soda-lime glass',
    source: 'Lakatos 1976, Table 1A, series S',
    composition_wt_pct: { SiO2: 69.7, Al2O3: 2.23, Na2O: 14.06, K2O: 0.04, CaO: 11.05, MgO: 2.23 },
    isokoms: [
      { logEta: 1, T_model_C: 1422.7, T_measured_C: 1422.7 + 4.7 },
      { logEta: 3, T_model_C: 1017.8, T_measured_C: 1017.8 + 2.1 },
      { logEta: 5, T_model_C:  824.6, T_measured_C:  824.6 + 2.3 },
    ],
    expectedModel: 'LAKATOS_1976',
    tolerance_model_C: 2.0, // paper value is rounded to 0.1°C; allow 2°C
  },
  {
    id: 'S28',
    description: 'High SiO₂ soda-lime glass with K₂O',
    source: 'Lakatos 1976, Table 1A, series S',
    composition_wt_pct: { SiO2: 72.37, Al2O3: 2.02, Na2O: 12.87, K2O: 0.08, CaO: 11.12, MgO: 0.65 },
    isokoms: [
      { logEta: 1, T_model_C: 1467.3, T_measured_C: 1467.3 + 4.9 },
      { logEta: 3, T_model_C: 1039.1, T_measured_C: 1039.1 + 2.9 },
      { logEta: 5, T_model_C:  837.6, T_measured_C:  837.6 + 3.1 },
    ],
    expectedModel: 'LAKATOS_1976',
    tolerance_model_C: 1.0,
  },
  {
    id: 'D6',
    description: 'BaO-bearing glass',
    source: 'Lakatos 1976, Table 1A, series D',
    composition_wt_pct: { SiO2: 64.82, Al2O3: 1.1, Na2O: 12.7, CaO: 4.48, BaO: 16.54 },
    isokoms: [
      { logEta: 1, T_model_C: 1385.7, T_measured_C: 1385.7 + 2.7 },
      { logEta: 3, T_model_C:  971.2, T_measured_C:  971.2 + 1.1 },
      { logEta: 5, T_model_C:  777.9, T_measured_C:  777.9 + 1.3 },
    ],
    expectedModel: 'LAKATOS_1976',
    tolerance_model_C: 2.0, // BaO term introduces more rounding
  },
  {
    id: 'D17',
    description: 'High B₂O₃ soda-lime glass',
    source: 'Lakatos 1976, Table 1A, series D',
    composition_wt_pct: { SiO2: 62.01, Al2O3: 1.05, Na2O: 12.15, CaO: 10.42, B2O3: 14.37 },
    isokoms: [
      { logEta: 1, T_model_C: 1200.0, T_measured_C: 1200.0 - 1.4 },
      { logEta: 3, T_model_C:  905.3, T_measured_C:  905.3 - 0.7 },
      { logEta: 5, T_model_C:  772.4, T_measured_C:  772.4 - 0.6 },
    ],
    expectedModel: 'LAKATOS_1976',
    tolerance_model_C: 2.0,
  },
  {
    id: 'F2-10',
    description: 'Float glass with Li₂O',
    source: 'Lakatos 1976, Table 1B, series F₂',
    composition_wt_pct: { SiO2: 73.3, Al2O3: 1.65, Na2O: 11.2, K2O: 0.48, Li2O: 3.0, CaO: 10.3 },
    isokoms: [
      { logEta: 1, T_model_C: 1365.4, T_measured_C: 1365.4 - 5.1 },
      { logEta: 3, T_model_C:  939.2, T_measured_C:  939.2 - 0.7 },
      { logEta: 5, T_model_C:  743.0, T_measured_C:  743.0 - 2.0 },
    ],
    expectedModel: 'LAKATOS_1976',
    tolerance_model_C: 1.0,
  },
  {
    id: 'FAL5',
    description: 'Alumino-silicate with K₂O + MgO',
    source: 'Lakatos 1976, Table 1B, series FAL',
    composition_wt_pct: { SiO2: 68.0, Al2O3: 6.0, Na2O: 11.0, K2O: 2.0, CaO: 11.0, MgO: 2.0 },
    isokoms: [
      { logEta: 1, T_model_C: 1499.7, T_measured_C: 1499.7 + 1.0 },
      { logEta: 3, T_model_C: 1069.9, T_measured_C: 1069.9 + 2.0 },
      { logEta: 5, T_model_C:  864.3, T_measured_C:  864.3 + 0.2 },
    ],
    expectedModel: 'LAKATOS_1976',
    tolerance_model_C: 1.0,
  },
];

// ─── FLUEGEL 2007 — mol% compositions (primary source), wt% derived ───────────
// Isokom levels: log η = 1.5, 6.6, 12.0 Pa·s
// wt% derived from mol% using: wt_i = mol_i × M_i, then normalise to 100%
// Molar masses (g/mol): SiO2=60.08, Al2O3=101.96, Na2O=61.98, K2O=94.20,
//   MgO=40.30, CaO=56.08, SO3=80.06, Fe2O3=159.69, TiO2=79.87, ZnO=81.38,
//   B2O3=69.62, Li2O=29.88, PbO=223.20
// Tolerance: 5°C — Fluegel regression SE is 10–17°C; implementation must
//   reproduce model output (not experiment) to within 5°C.

export const FLUEGEL_VALIDATION_GLASSES: GlassValidationEntry[] = [
  {
    id: 'Fluegel-CO',
    description: 'Soda-lime container glass (CO)',
    source: 'Fluegel 2007, Table 1 (mol%) + Table 12',
    // Primary source: Table 1, mol%
    composition_mol_pct: { SiO2: 74.41, Al2O3: 0.75, Na2O: 12.9, K2O: 0.19, MgO: 0.3, CaO: 11.27, SO3: 0.16, Fe2O3: 0.01, TiO2: 0.01 },
    // Derived wt% = mol% × molar_mass, normalised
    composition_wt_pct: { SiO2: 74.215, Al2O3: 1.269, Na2O: 13.273, K2O: 0.297, MgO: 0.201, CaO: 10.492, SO3: 0.213, Fe2O3: 0.027, TiO2: 0.013 },
    isokoms: [
      { logEta: 1.5,  T_model_C: 1468, T_measured_C: 1467 },
      { logEta: 6.6,  T_model_C:  793, T_measured_C:  793 },  // from Fluegel table 2
      { logEta: 12.0, T_model_C:  611, T_measured_C:  611 },  // estimated from VTF
    ],
    expectedModel: 'FLUEGEL_2007',
    tolerance_model_C: 5.0,
  },
  {
    id: 'Fluegel-710A',
    description: 'NIST SRM 710A soda-lime-silica standard',
    source: 'Fluegel 2007, Table 1 (mol%) + Table 12',
    composition_mol_pct: { SiO2: 71.43, Al2O3: 1.31, Na2O: 8.25, K2O: 6.27, CaO: 9.62, TiO2: 0.32, ZnO: 2.81 },
    // Derived wt%
    composition_wt_pct: { SiO2: 67.895, Al2O3: 2.113, Na2O: 8.09, K2O: 9.344, CaO: 8.535, TiO2: 0.404, ZnO: 3.618 },
    isokoms: [
      { logEta: 1.5,  T_model_C: 1314, T_measured_C: 1319 },
      { logEta: 6.6,  T_model_C:  729, T_measured_C:  731 },
      { logEta: 12.0, T_model_C:  551, T_measured_C:  545 },
    ],
    expectedModel: 'FLUEGEL_2007',
    tolerance_model_C: 5.0,
  },
  {
    id: 'Fluegel-717A',
    description: 'NIST SRM 717A borosilicate standard',
    source: 'Fluegel 2007, Table 1 (mol%) + Table 12',
    composition_mol_pct: { SiO2: 72.25, Al2O3: 2.19, Na2O: 1.03, K2O: 5.42, B2O3: 16.97, Li2O: 2.14 },
    // Derived wt%
    composition_wt_pct: { SiO2: 67.996, Al2O3: 3.498, Na2O: 1.0, K2O: 7.998, B2O3: 18.507, Li2O: 1.002 },
    isokoms: [
      { logEta: 1.5,  T_model_C: 1378, T_measured_C: 1388 },
      { logEta: 6.6,  T_model_C:  731, T_measured_C:  719 },
      { logEta: 12.0, T_model_C:  520, T_measured_C:  514 },
    ],
    expectedModel: 'FLUEGEL_2007',
    tolerance_model_C: 5.0,
  },
  {
    id: 'Fluegel-711',
    description: 'Lead silicate glass 711',
    source: 'Fluegel 2007, Table 1 (mol%) + Table 12',
    composition_mol_pct: { SiO2: 71.28, Al2O3: 0.51, Na2O: 3.76, K2O: 5.55, PbO: 18.9 },
    // Derived wt%: PbO is very heavy (M=223.20) so wt% PbO >> mol% PbO
    composition_wt_pct: { SiO2: 46.005, Al2O3: 0.559, Na2O: 2.503, K2O: 5.616, PbO: 45.317 },
    isokoms: [
      { logEta: 1.5,  T_model_C: 1172, T_measured_C: 1185 },
      { logEta: 6.6,  T_model_C:  614, T_measured_C:  614 },
      { logEta: 12.0, T_model_C:  445, T_measured_C:  443 },
    ],
    expectedModel: 'FLUEGEL_2007',
    tolerance_model_C: 5.0,
  },
  {
    id: 'Fluegel-710',
    description: 'Glass 710 soda-lime-silica',
    source: 'Fluegel 2007, Table 1 (mol%) + Table 12',
    composition_mol_pct: { SiO2: 72.74, Al2O3: 0.11, Na2O: 8.7, K2O: 5.07, CaO: 12.82, Fe2O3: 0.01 },
    // Derived wt%
    composition_wt_pct: { SiO2: 71.423, Al2O3: 0.183, Na2O: 8.813, K2O: 7.805, CaO: 11.75, Fe2O3: 0.026 },
    isokoms: [
      { logEta: 1.5,  T_model_C: 1294, T_measured_C: 1293 },
      { logEta: 6.6,  T_model_C:  732, T_measured_C:  725 },
      { logEta: 12.0, T_model_C:  564, T_measured_C:  556 },
    ],
    expectedModel: 'FLUEGEL_2007',
    tolerance_model_C: 5.0,
  },
  {
    id: 'Fluegel-DGG-I',
    description: 'DGG I optical glass standard',
    source: 'Fluegel 2007, Table 1 (mol%) + Table 12',
    composition_mol_pct: { SiO2: 70.94, Al2O3: 0.72, Na2O: 14.34, K2O: 0.21, MgO: 6.16, CaO: 7.13, SO3: 0.32, Fe2O3: 0.07, TiO2: 0.1 },
    // Derived wt%
    composition_wt_pct: { SiO2: 71.789, Al2O3: 1.237, Na2O: 14.971, K2O: 0.333, MgO: 4.181, CaO: 6.735, SO3: 0.432, Fe2O3: 0.188, TiO2: 0.135 },
    isokoms: [
      { logEta: 1.5,  T_model_C: 1303, T_measured_C: 1301 },
      { logEta: 6.6,  T_model_C:  715, T_measured_C:  721 },
      { logEta: 12.0, T_model_C:  535, T_measured_C:  539 },
    ],
    expectedModel: 'FLUEGEL_2007',
    tolerance_model_C: 5.0,
  },
];

// ─── HETHERINGTON 1964 — pure fused silica ─────────────────────────────────────
// Formula: log₁₀(η / Pa·s) = −3.905 + 31400 / T_K  (Arrhenius)
// Computed self-check points (not independent measurements — formula is exact)

export const HETHERINGTON_VALIDATION_GLASSES: GlassValidationEntry[] = [
  {
    id: 'Hetherington-SiO2',
    description: 'Pure fused silica — Hetherington 1964',
    source: 'Hetherington et al. (1964), Physics and Chemistry of Glasses 5(5):130–136',
    composition_wt_pct: { SiO2: 100 },
    isokoms: [
      // T_K = 31400 / (logEta − (−3.905)) − 273.15
      { logEta:  9.91, T_model_C: 2000 },  // 31400/(9.91+3.905)-273.15 = 2000°C
      { logEta: 11.24, T_model_C: 1800 },  // 31400/(11.24+3.905)-273.15 = 1800°C
      { logEta: 12.86, T_model_C: 1600 },  // 31400/(12.86+3.905)-273.15 = 1600°C
    ],
    expectedModel: 'HETHERINGTON_1964',
    tolerance_model_C: 1.0,
  },
];

