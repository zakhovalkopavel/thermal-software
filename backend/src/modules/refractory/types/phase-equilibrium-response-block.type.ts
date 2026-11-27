import type { PhaseEquilibriumResponsePart } from './phase-equilibrium-response-part.type';

/** Liquid or glass total with its parts. */
export type PhaseEquilibriumResponseBlock = {
  /** Amount [% of the fired body] */
  percent: number;

  /** Mass [kg] */
  mass: number;

  /** Bulk composition [wt%] */
  composition: Record<string, number>;

  /** Contributions of matrix and unreacted cores */
  parts: PhaseEquilibriumResponsePart[];
};
