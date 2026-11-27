import type { UnreactedPhaseState } from '../enums/unreacted-phase-state.enum';
import type { PhaseEquilibriumGlassPoints } from './phase-equilibrium-glass-points.type';
import type { PhaseEquilibriumViscosity } from './phase-equilibrium-viscosity.type';

/** An original phase of a material that did not react (grain core). */
export type PhaseEquilibriumUnreactedPhase = {
  /** Material the phase belongs to */
  materialId: string;

  /** Stable phase identifier, e.g. `corundum` or `glass` */
  phaseId: string;

  /** Display name */
  phase: string;

  /** Formula; `glass` remainders use the material name */
  formula: string;

  /** Original amount [% of the fired body] */
  originalPercent: number;

  /** Original mass [kg] */
  originalMass: number;

  /** Unreacted amount [% of the fired body] */
  unreactedPercent: number;

  /** Unreacted mass [kg] */
  unreactedMass: number;

  /** Unreacted share of the original amount [%] */
  unreactedShare: number;

  /** State of the unreacted core */
  state: UnreactedPhaseState;

  /** Composition [wt%]; only for glass remainders */
  composition?: Record<string, number>;

  /** η(T) of an amorphous core; null when no model applies */
  viscosity?: PhaseEquilibriumViscosity | null;

  /** Glass points of an amorphous core; null for slag models */
  glassPoints?: PhaseEquilibriumGlassPoints | null;
};
