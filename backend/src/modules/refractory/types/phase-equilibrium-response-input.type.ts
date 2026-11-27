import type { AlgorithmMode } from '../enums/algorithm-mode.enum';
import type { PhaseEquilibriumComparison } from './phase-equilibrium-comparison.type';
import type { PhaseEquilibriumEngineResult } from './phase-equilibrium-engine-result.type';
import type { PhaseEquilibriumFractionState } from './phase-equilibrium-fraction-state.type';
import type { PhaseEquilibriumMatrix } from './phase-equilibrium-matrix.type';
import type { PhaseEquilibriumGlassPoints } from './phase-equilibrium-glass-points.type';
import type { PhaseEquilibriumUnreactedPhase } from './phase-equilibrium-unreacted-phase.type';
import type { PhaseEquilibriumViscosity } from './phase-equilibrium-viscosity.type';

/** Everything the response builder needs to assemble the API result. */
export type PhaseEquilibriumResponseInput = {
  /** Algorithm mode of the request */
  mode: AlgorithmMode;

  /** Primary engine result on the matrix */
  engine: PhaseEquilibriumEngineResult;

  /** Reacted matrix */
  matrix: PhaseEquilibriumMatrix;

  /** Unreacted original phases of the grain cores */
  unreacted: PhaseEquilibriumUnreactedPhase[];

  /** Size fractions after the grain-reaction model */
  states: PhaseEquilibriumFractionState[];

  /** Firing temperature [°C] */
  temperature: number;

  /** Hold time [h] */
  holdTime_hours: number;

  /** Fired mass of the body [kg] */
  totalMass: number;

  /** Viscosity of the matrix liquid; null when unavailable */
  viscosity: PhaseEquilibriumViscosity | null;

  /** Glass points of the quenched matrix liquid; null for slag models */
  liquidGlassPoints: PhaseEquilibriumGlassPoints | null;

  /** CALPHAD vs legacy comparison (compare mode) */
  comparison?: PhaseEquilibriumComparison;

  /** Warnings collected by the orchestrator */
  warnings: string[];
};
