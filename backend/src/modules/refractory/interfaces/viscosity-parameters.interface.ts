/**
 * Viscosity calculation type interfaces
 */

// ─── VTF fitting layer ────────────────────────────────────────────────────────

/** A single (temperature, log viscosity) calibration point. */
export interface VtfPoint {
  /** Temperature in °C */
  T_celsius: number;
  /** log₁₀(η [Pa·s]) */
  logEtaPaS: number;
}

/** Fitted VTF (Vogel-Tammann-Fulcher) parameters.
 *  Equation: log₁₀(η [Pa·s]) = A + B / (T [°C] − T₀)
 *  Inversion: T = B / (log η − A) + T₀ */
export interface VtfParameters {
  /** High-temperature limiting log₁₀ viscosity (dimensionless) */
  A: number;
  /** Pseudo-activation-energy parameter (K, must be > 0) */
  B: number;
  /** Vogel temperature (°C, must be > 0 and < lowest isokom T) */
  T0: number;
}

// ─── Lakatos 1976 ─────────────────────────────────────────────────────────────

/** Output from Lakatos 1976 isokom regression before VTF fitting. */
export interface LakatosIsokoms {
  /** Temperature at log η = 1 Pa·s (converted from 2 poise) */
  T_logEta1: number;
  /** Temperature at log η = 3 Pa·s (converted from 4 poise) */
  T_logEta3: number;
  /** Temperature at log η = 5 Pa·s (converted from 6 poise) */
  T_logEta5: number;
  /** Warnings about composition out of training range */
  warnings: string[];
}

// ─── Fluegel 2007 ─────────────────────────────────────────────────────────────

/** Output from Fluegel 2007 polynomial regression before VTF fitting. */
export interface FluegelIsokoms {
  /** Temperature at log η = 1.5 Pa·s */
  T_logEta1_5: number;
  /** Temperature at log η = 6.6 Pa·s */
  T_logEta6_6: number;
  /** Temperature at log η = 12.0 Pa·s */
  T_logEta12: number;
  /** Warnings about components outside Fluegel validity bounds */
  warnings: string[];
}

// ─── Slag models (Iida 1988 / Nakamoto 2007) ──────────────────────────────────

/** Result of a slag viscosity calculation (no VTF, no glass fixed points). */
export interface SlagViscosityResult {
  /** Calculated viscosity in Pa·s (NaN if below liquidus) */
  viscosity_Pas: number;
  /** log₁₀ of viscosity (NaN if below liquidus) */
  logViscosity_Pas: number;
  /** Temperature at which it was calculated (°C) */
  temperature_C: number;
  /** Estimated liquidus temperature from Mills/NPL regression (°C) */
  liquidusTemperature_C: number;
  /** Whether temperature is above / near / below liquidus */
  thermalState: 'ABOVE_LIQUIDUS' | 'NEAR_LIQUIDUS' | 'BELOW_LIQUIDUS';
  /** Model used */
  model: 'IIDA' | 'NAKAMOTO_2007';
  /** Warnings */
  warnings: string[];
  // ─── Iida-specific ───────────────────────────────────────────────────────
  /** Simple basicity index B_i (Iida) */
  B_i_simple?: number;
  /** Modified basicity index B_i* with dynamic Al₂O₃ treatment (Iida) */
  B_i_star?: number;
  /** Dynamic Al₂O₃ interaction coefficient α used in B_i* (Iida) */
  alpha_Al2O3?: number;
  /** Activation energy factor E (Iida) */
  E_activation?: number;
  // ─── Nakamoto-specific ───────────────────────────────────────────────────
  /** Total activation energy E = Σ(eᵢ·Xᵢ) in J/mol (Nakamoto) */
  E_total_J_mol?: number;
  /** ln(A) pre-exponential (Nakamoto) */
  lnA?: number;
  /** Average molar mass M_avg (Nakamoto) */
  M_avg?: number;
}

// ─── Model selection result ───────────────────────────────────────────────────

import { ViscosityModel } from '../enums/viscosity-model.enum';

export interface ModelSelectionResult {
  primary: ViscosityModel;
  /** Secondary recommendation (e.g. Urbain when Riboud is primary) */
  secondary?: ViscosityModel;
  /** Reason for selection */
  reason: string;
  /** Composition range warnings */
  warnings: string[];
}
