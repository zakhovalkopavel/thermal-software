/** Successful nested liquid speciation used as excess Gibbs in Engine C. */
export type LiquidSpeciationResult = {
  /** Excess Gibbs of the liquid batch relative to ideal oxide mixing [J] */
  excessGibbs_J: number;
  /** Absolute molar Gibbs of the speciated liquid [J] (diagnostics) */
  gibbs_J: number;
};
