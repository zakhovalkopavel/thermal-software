import type { PhaseEquilibriumPart } from './phase-equilibrium-part.type';

/** Liquid or glass total of the fired body. */
export type PhaseEquilibriumBlock = {
  /** % of the fired body */
  percent: number;
  /** kg */
  mass: number;
  /** wt% */
  composition: Record<string, number>;
  /** Matrix melt and/or unreacted amorphous cores */
  parts?: PhaseEquilibriumPart[];
};
