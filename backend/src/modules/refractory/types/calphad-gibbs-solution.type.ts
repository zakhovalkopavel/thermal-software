import type { PhaseEquilibriumCrystal } from './phase-equilibrium-crystal.type';

/** Successful Gibbs minimisation of the matrix at one temperature. */
export type CalphadGibbsSolution = {
  liquidPercent: number;
  solidPercent: number;
  liquidComposition: Record<string, number>;
  solidComposition: Record<string, number>;
  crystals: PhaseEquilibriumCrystal[];
  /** Total molar Gibbs of the assemblage [J] for diagnostics */
  gibbs_J: number;
  /** Mass-balance residual (max absolute oxide mole error) */
  residualMax_mol: number;
  /** True when Abdul oxide-end-member Redlich–Kister excess entered the liquid objective */
  usedAbdulExcess: boolean;
  /** True when Abdul associate speciation entered the liquid objective */
  usedAssociateSpeciation: boolean;
  /** True when Mao ionic P–Q speciation entered the liquid objective */
  usedMaoIonic: boolean;
};
