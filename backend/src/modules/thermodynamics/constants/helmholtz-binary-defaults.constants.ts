/**
 * Default binary interaction parameters when CoolProp has no pair row.
 * Rule 1: Lorentz–Berthelot. Rule 2: arithmetic γ_T for asymmetric Tc.
 */
export const HELMHOLTZ_BINARY_DEFAULTS = {
  /** Rule 1 — β_T,ij */
  BETA_T: 1,
  /** Rule 1 — γ_T,ij (overridden by Rule 2 when asymmetric) */
  GAMMA_T: 1,
  /** Rule 1 — β_v,ij */
  BETA_V: 1,
  /** Rule 1 — γ_v,ij */
  GAMMA_V: 1,
  /** Rule 1 — departure scale F_ij (no excess α^E) */
  F: 0,
  /**
   * Rule 2 — use arithmetic γ_T when max(Tc)/min(Tc) ≥ this
   * (or either fluid is listed in ASYMMETRIC_FLUID_KEYS).
   */
  ASYMMETRIC_TC_RATIO: 2,
  /** CoolProp fluid names that always take Rule 2 γ_T with any partner */
  ASYMMETRIC_FLUID_KEYS: ['Hydrogen', 'Helium', 'Neon'] as const,
} as const;
