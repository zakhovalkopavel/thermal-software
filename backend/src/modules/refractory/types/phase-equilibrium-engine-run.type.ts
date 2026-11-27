import type { PhaseEquilibriumComparison } from './phase-equilibrium-comparison.type';
import type { PhaseEquilibriumEngineResult } from './phase-equilibrium-engine-result.type';

/** Outcome of running the engine(s) selected by the algorithm mode. */
export type PhaseEquilibriumEngineRun = {
  /** Result that drives the response */
  primary: PhaseEquilibriumEngineResult;

  /** CALPHAD vs legacy comparison (compare mode) */
  comparison?: PhaseEquilibriumComparison;

  /** Notes about skipped engines */
  warnings: string[];
};
