/** Pseudo-critical / polarity parameters from Chung mixing rules (Poling §9-5). */
export type ChungMixtureParams = {
  /** Mixture critical temperature [K] */
  Tc: number;
  /** Mixture critical molar volume [m³/mol] */
  Vc: number;
  /** Mixture acentric factor [-] */
  omega: number;
  /** Mixture reduced dipole moment μ_r [-] */
  mur: number;
  /** Chung mixture molar mass [kg/mol] (Eq. 9-5.28) */
  M: number;
  /** Association factor κ_m (0 in this implementation) */
  kappa: number;
};