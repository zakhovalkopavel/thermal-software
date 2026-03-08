/**
 * Hetherington 1964 — Validation Glass Dataset (pure fused silica)
 *
 * Formula: log₁₀(η / Pa·s) = −3.905 + 31400 / T_K  (Arrhenius)
 * These are computed self-check points — not independent measurements.
 *
 * Source:
 *   Hetherington, G.; Jack, K.H.; Kennedy, J.C. (1964).
 *   "The Viscosity of Vitreous Silica."
 *   Physics and Chemistry of Glasses 5(5):130–136.
 */

import type { GlassValidationEntry } from './interfaces/glass-viscosity-validation.interface';

export const HETHERINGTON_VALIDATION_GLASSES: GlassValidationEntry[] = [
  {
    id: 'Hetherington-SiO2',
    description: 'Pure fused silica — Hetherington 1964',
    source: 'Hetherington et al. (1964), Physics and Chemistry of Glasses 5(5):130–136',
    composition_wt_pct: { SiO2: 100 },
    isokoms: [
      // T_K = 31400 / (logEta − (−3.905)) − 273.15
      { logEta:  9.91, T_model_C: 2000 },  // 31400/(9.91+3.905) − 273.15 ≈ 2000°C
      { logEta: 11.24, T_model_C: 1800 },  // 31400/(11.24+3.905) − 273.15 ≈ 1800°C
      { logEta: 12.86, T_model_C: 1600 },  // 31400/(12.86+3.905) − 273.15 ≈ 1600°C
    ],
    expectedModel: 'HETHERINGTON_1964',
    tolerance_model_C: 1.0,
  },
];

