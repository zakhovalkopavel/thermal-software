/** Pure-species inputs for Hirschfelder–Eucken (Mason–Saxena) mixture λ. */
export type HirschfelderEuckenSpecies = {
  /** Mole fraction [-] */
  y: number;
  /** Pure thermal conductivity [W/(m·K)] */
  lambda: number;
  /** Pure dynamic viscosity [Pa·s] */
  eta: number;
  /** Molar mass [kg/mol] */
  M: number;
};
