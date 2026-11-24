/** Result of a slag viscosity calculation (no VTF, no glass fixed points). */
export type SlagViscosityResult = {
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
};
