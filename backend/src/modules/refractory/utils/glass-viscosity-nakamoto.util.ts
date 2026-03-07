/**
 * Nakamoto 2007 Viscosity Model — Fluoride-Bearing Slag
 *
 * Activation-energy model for multi-component slags, especially CaF₂-bearing:
 *   η [Pa·s] = A · T · exp(E / RT)
 *   E = Σ(eᵢ · Xᵢ)
 *   ln(A) = −20.5 + 0.025 · M_avg
 *
 * Reference:
 *   Nakamoto, H., Kiyose, A., & Tanaka, T. (2007).
 *   "A model for estimating the viscosity of multi-component slags containing
 *    alkali oxide and calcium fluoride."
 *   ISIJ International, 47(11):1583–1590.
 *
 * Valid: T = 1200–1900 °C, CaF₂ > 5 mol% recommended, above liquidus.
 * NOT for glasses below liquidus — no softening/annealing points.
 */

import { NAKAMOTO_2007, MILLS_LIQUIDUS } from '../constants/viscosity-parameters';
import { SlagViscosityResult } from '../interfaces/viscosity-parameters.interface';
import { wtPctToMolPct } from './glass-composition.util';
import { estimateLiquidusMills } from './glass-viscosity-iida.util';

const R = NAKAMOTO_2007.R;

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Calculate molten slag viscosity using the Nakamoto 2007 model.
 *
 * @param comp_wt_pct   Normalised wt% oxide composition
 * @param temperature_C Temperature in °C (must be above liquidus)
 */
export function calcNakamotoViscosity(
  comp_wt_pct: Record<string, number>,
  temperature_C: number,
): SlagViscosityResult {
  const warnings: string[] = [];
  const T_K = temperature_C + 273.15;

  // ── Liquidus safety check ─────────────────────────────────────────────────
  const T_liq = estimateLiquidusMills(comp_wt_pct);
  const thermalState =
    temperature_C <= T_liq      ? 'BELOW_LIQUIDUS' :
    temperature_C <= T_liq + 50 ? 'NEAR_LIQUIDUS'  : 'ABOVE_LIQUIDUS';

  if (thermalState === 'BELOW_LIQUIDUS') {
    warnings.push(`T = ${temperature_C} °C is below estimated liquidus (${T_liq.toFixed(0)} °C) — viscosity undefined`);
    return { viscosity_Pas: NaN, logViscosity_Pas: NaN, temperature_C, liquidusTemperature_C: T_liq, thermalState, model: 'NAKAMOTO_2007', warnings };
  }
  if (thermalState === 'NEAR_LIQUIDUS') {
    warnings.push(`T = ${temperature_C} °C is within 50 K of estimated liquidus (${T_liq.toFixed(0)} °C) — near-liquidus region, accuracy reduced`);
  }
  if (temperature_C < NAKAMOTO_2007.temperatureRange.min_C) warnings.push(`T = ${temperature_C} °C below Nakamoto valid range (${NAKAMOTO_2007.temperatureRange.min_C} °C)`);
  if (temperature_C > NAKAMOTO_2007.temperatureRange.max_C) warnings.push(`T = ${temperature_C} °C above Nakamoto valid range (${NAKAMOTO_2007.temperatureRange.max_C} °C)`);

  // ── Fluoride volatilisation warning ──────────────────────────────────────
  if (temperature_C > 1700 && (comp_wt_pct['CaF2'] ?? 0) > 0) {
    warnings.push(`T = ${temperature_C} °C > 1700 °C with CaF₂ present — fluoride volatilisation may change actual composition`);
  }

  // ── Mole fractions (only Nakamoto components) ─────────────────────────────
  let molSum = 0;
  const mols: Record<string, number> = {};
  for (const [k, wt] of Object.entries(comp_wt_pct)) {
    if (wt > 0 && NAKAMOTO_2007.molarMass[k] !== undefined) {
      mols[k] = wt / NAKAMOTO_2007.molarMass[k];
      molSum  += mols[k];
    }
  }
  if (molSum === 0) throw new Error('Nakamoto: no recognised slag components found');

  const X: Record<string, number> = {};
  for (const [k, m] of Object.entries(mols)) X[k] = m / molSum;

  // ── Unrecognised components warning ──────────────────────────────────────
  const ignored = Object.entries(comp_wt_pct)
    .filter(([k, v]) => v > 0 && NAKAMOTO_2007.molarMass[k] === undefined)
    .map(([k]) => k);
  if (ignored.length > 0) {
    warnings.push(`Components not modelled by Nakamoto 2007: ${ignored.join(', ')} — excluded from calculation`);
  }

  // ── Al₂O₃ acid-correction ─────────────────────────────────────────────────
  const X_SiO2 = X['SiO2'] ?? 0;
  const e_eff: Record<string, number> = { ...NAKAMOTO_2007.e };
  if (X_SiO2 > NAKAMOTO_2007.SiO2_acid_threshold) {
    e_eff['Al2O3'] = NAKAMOTO_2007.e['Al2O3'] * NAKAMOTO_2007.Al2O3_acid_correction;
    warnings.push(`SiO₂ = ${(X_SiO2 * 100).toFixed(1)} mol% > ${NAKAMOTO_2007.SiO2_acid_threshold * 100}% — applying Al₂O₃ acid correction (e_Al₂O₃ × ${NAKAMOTO_2007.Al2O3_acid_correction})`);
  }

  // ── E = Σ(eᵢ · Xᵢ) ───────────────────────────────────────────────────────
  let E_total = 0;
  for (const [k, x] of Object.entries(X)) {
    E_total += (e_eff[k] ?? 0) * x;
  }

  // ── M_avg = Σ(Xᵢ · Mᵢ) ───────────────────────────────────────────────────
  let M_avg = 0;
  for (const [k, x] of Object.entries(X)) {
    M_avg += x * (NAKAMOTO_2007.molarMass[k] ?? 0);
  }

  // ── ln(A) = −20.5 + 0.025 · M_avg ────────────────────────────────────────
  const lnA = NAKAMOTO_2007.lnA_intercept + NAKAMOTO_2007.lnA_slope * M_avg;
  const A   = Math.exp(lnA);

  // ── η = A · T · exp(E / RT) ───────────────────────────────────────────────
  const viscosity_Pas    = A * T_K * Math.exp(E_total / (R * T_K));
  const logViscosity_Pas = Math.log10(viscosity_Pas);

  return {
    viscosity_Pas:         Number(viscosity_Pas.toFixed(5)),
    logViscosity_Pas:      Number(logViscosity_Pas.toFixed(3)),
    temperature_C,
    liquidusTemperature_C: Number(T_liq.toFixed(0)),
    thermalState,
    model: 'NAKAMOTO_2007',
    E_total_J_mol: Number(E_total.toFixed(0)),
    lnA:           Number(lnA.toFixed(4)),
    M_avg:         Number(M_avg.toFixed(2)),
    warnings,
  };
}

