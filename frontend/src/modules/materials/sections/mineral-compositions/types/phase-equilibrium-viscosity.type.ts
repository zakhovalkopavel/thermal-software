/** Melt viscosity of a liquid or glass part at the firing temperature. */
export type PhaseEquilibriumViscosity = {
  model: string;
  confidence: string;
  /** log₁₀(η) [Pa·s] */
  logViscosity: number;
  /** η [Pa·s] */
  viscosity_Pas: number;
};
