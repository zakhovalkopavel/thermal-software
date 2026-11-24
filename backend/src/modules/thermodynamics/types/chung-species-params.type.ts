/** Pure-species inputs for Chung mixing rules and dense-gas λ. */
export type ChungSpeciesParams = {
  /** Mole fraction [-] */
  y: number;
  /** Molar mass [kg/mol] */
  M: number;
  /** Critical temperature [K] */
  Tc: number;
  /** Critical molar volume [m³/mol] */
  Vc: number;
  /** Acentric factor [-] */
  omega: number;
  /** Dipole moment [Debye] */
  dipole_D: number;
};
