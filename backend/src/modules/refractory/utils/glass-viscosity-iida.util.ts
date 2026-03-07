/**
 * Iida Viscosity Model — Industrial Mixed Slag
 *
 * Modified Weymann-Frenkel equation with basicity-index correction:
 *   η [Pa·s] = A · η₀ · exp(E / B_i*)
 *
 * References:
 *   Iida, T. & Guthrie, R.I.L. (1988). The Physical Properties of Liquid Metals. Oxford.
 *   Mills, K.C. (2011). Estimating the Physical Properties of Slags. SAIMM.
 *   Allibert, M. & VDEh (1995). Slag Atlas (2nd Ed.). Verlag Stahleisen.
 *
 * Valid: T = 1300–1800 °C, CaF₂ ≤ 8 mol%, above liquidus.
 * NOT for glasses below liquidus — no softening/annealing points.
 */

import { IIDA_MODEL, MILLS_LIQUIDUS, MOLAR_MASSES } from '../constants/viscosity-parameters';
import { SlagViscosityResult } from '../interfaces/viscosity-parameters.interface';
import { wtPctToMolPct } from './glass-composition.util';

const R = 8.314; // J/(mol·K)

// ─── Liquidus helper (shared between Iida and Nakamoto) ──────────────────────

/**
 * Estimate liquidus temperature using the Mills/NPL linear regression.
 * T_liq [°C] = 1225 + Σ(k_i · W_i)
 */
export function estimateLiquidusMills(comp_wt_pct: Record<string, number>): number {
  let T = MILLS_LIQUIDUS.intercept;
  for (const [oxide, wt] of Object.entries(comp_wt_pct)) {
    const k = MILLS_LIQUIDUS.k[oxide];
    if (k !== undefined) T += k * wt;
  }
  return T;
}

// ─── Mole fractions ──────────────────────────────────────────────────────────

function toMoleFractions(comp_wt_pct: Record<string, number>): Record<string, number> {
  let molSum = 0;
  const mols: Record<string, number> = {};
  for (const [k, wt] of Object.entries(comp_wt_pct)) {
    if (wt > 0) {
      const M = MOLAR_MASSES[k] ?? (IIDA_MODEL.components[k]?.M);
      if (M) { mols[k] = wt / M; molSum += mols[k]; }
    }
  }
  if (molSum === 0) throw new Error('Iida: no recognisable oxides in composition');
  const xf: Record<string, number> = {};
  for (const [k, m] of Object.entries(mols)) xf[k] = m / molSum;
  return xf;
}

// ─── η₀ᵢ — ideal pure-component viscosity ────────────────────────────────────

function calcIdealComponentViscosity(key: string, T_K: number): number {
  const c = IIDA_MODEL.components[key];
  if (!c) return 0;
  const { M, Tm, Vm, H } = c;
  // η₀ᵢ = 1.8×10⁻⁷ · √(M·Tm) / Vm^(2/3) · exp(H/RT)
  return 1.8e-7 * Math.sqrt(M * Tm) / Math.pow(Vm * 1e-6, 2 / 3) * Math.exp(H / (R * T_K));
}

// ─── Basicity index ───────────────────────────────────────────────────────────

interface BasicitResult {
  B_i: number;   // simple basicity index
  B_i_star: number; // modified (dynamic Al₂O₃)
  alpha_Al2O3: number;
}

function calcBasicity(comp_wt_pct: Record<string, number>): BasicitResult {
  let num = 0, den = 0;
  const W_Al2O3 = comp_wt_pct['Al2O3'] ?? 0;

  for (const [k, wt] of Object.entries(comp_wt_pct)) {
    if (k === 'Al2O3') continue;
    const a = IIDA_MODEL.alpha[k];
    if (!a) continue;
    if (a.type === 'basic') num += a.value * wt;
    else                    den += a.value * wt;
  }
  const B_i = den > 0 ? num / den : 0;

  // Dynamic Al₂O₃ amphoteric coefficient
  const alpha_Al2O3 = 0.13 * B_i * B_i - 0.38 * B_i + 0.53;
  const den_star = den + alpha_Al2O3 * W_Al2O3;
  const B_i_star = den_star > 0 ? num / den_star : 0;

  return { B_i, B_i_star, alpha_Al2O3 };
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Calculate molten slag viscosity using the Iida model.
 *
 * @param comp_wt_pct   Normalised wt% oxide composition
 * @param temperature_C Temperature in °C (must be above liquidus)
 */
export function calcIidaViscosity(
  comp_wt_pct: Record<string, number>,
  temperature_C: number,
): SlagViscosityResult {
  const warnings: string[] = [];
  const T_K = temperature_C + 273.15;

  const T_liq = estimateLiquidusMills(comp_wt_pct);
  const thermalState =
    temperature_C <= T_liq          ? 'BELOW_LIQUIDUS' :
    temperature_C <= T_liq + 50     ? 'NEAR_LIQUIDUS'  : 'ABOVE_LIQUIDUS';

  if (thermalState === 'BELOW_LIQUIDUS') {
    warnings.push(`T = ${temperature_C} °C is below estimated liquidus (${T_liq.toFixed(0)} °C) — viscosity undefined`);
    return { viscosity_Pas: NaN, logViscosity_Pas: NaN, temperature_C, liquidusTemperature_C: T_liq, thermalState, model: 'IIDA', warnings };
  }
  if (thermalState === 'NEAR_LIQUIDUS') {
    warnings.push(`T = ${temperature_C} °C is within 50 K of estimated liquidus (${T_liq.toFixed(0)} °C) — near-liquidus region, accuracy reduced`);
  }
  if (temperature_C < IIDA_MODEL.temperatureRange.min_C) warnings.push(`T = ${temperature_C} °C below Iida valid range (${IIDA_MODEL.temperatureRange.min_C} °C)`);
  if (temperature_C > IIDA_MODEL.temperatureRange.max_C) warnings.push(`T = ${temperature_C} °C above Iida valid range (${IIDA_MODEL.temperatureRange.max_C} °C)`);

  // CaF₂ check
  const molPct = wtPctToMolPct(comp_wt_pct);
  const X_CaF2 = (molPct['CaF2'] ?? 0) / 100;
  if (X_CaF2 > IIDA_MODEL.CaF2_max_mol) {
    warnings.push(`CaF₂ = ${(X_CaF2 * 100).toFixed(1)} mol% exceeds Iida limit (${IIDA_MODEL.CaF2_max_mol * 100} mol%) — consider Nakamoto 2007`);
  }

  const xf = toMoleFractions(comp_wt_pct);

  // Ideal mixture viscosity η₀ = Σ(η₀ᵢ · Xᵢ)
  let eta0 = 0;
  for (const [k, x] of Object.entries(xf)) {
    if (x > 0) eta0 += x * calcIdealComponentViscosity(k, T_K);
  }

  const { B_i, B_i_star, alpha_Al2O3 } = calcBasicity(comp_wt_pct);

  // Activation energy factor E
  const E = 10.29 / Math.pow(B_i_star + 0.31, 2) + 1.13;

  const viscosity_Pas = IIDA_MODEL.A * eta0 * Math.exp(E / B_i_star);
  const logViscosity_Pas = Math.log10(viscosity_Pas);

  return {
    viscosity_Pas:        Number(viscosity_Pas.toFixed(5)),
    logViscosity_Pas:     Number(logViscosity_Pas.toFixed(3)),
    temperature_C,
    liquidusTemperature_C: Number(T_liq.toFixed(0)),
    thermalState,
    model: 'IIDA',
    B_i_simple:    Number(B_i.toFixed(4)),
    B_i_star:      Number(B_i_star.toFixed(4)),
    alpha_Al2O3:   Number(alpha_Al2O3.toFixed(4)),
    E_activation:  Number(E.toFixed(4)),
    warnings,
  };
}

