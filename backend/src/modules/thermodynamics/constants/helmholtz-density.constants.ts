/** Bracket / tolerance settings for Helmholtz p(ρ,T)=P root (gas-focused). */
export const HELMHOLTZ_DENSITY = {
  /** Absolute tolerance passed to brentq [mol/m³] */
  BRENTQ_TOL_MOL_M3: 1e-10,
  /** Lower bracket factor relative to ideal-gas molar density */
  BRACKET_LOW_FACTOR: 0.25,
  /** Upper bracket factor relative to ideal-gas molar density */
  BRACKET_HIGH_FACTOR: 4,
  /** Upper bracket also at least this multiple of reducing density */
  BRACKET_RHOR_FACTOR: 2,
  /** Max bracket expansion iterations when signs do not oppose */
  BRACKET_EXPAND_MAX: 12,
  /** Floor for lower molar-density bracket [mol/m³] */
  BRACKET_LOW_FLOOR_MOL_M3: 1e-8,
  /** Offset δ,τ away from the critical reducing point for non-analytic terms */
  NON_ANALYTIC_OFFSET: 1e-12,
} as const;
