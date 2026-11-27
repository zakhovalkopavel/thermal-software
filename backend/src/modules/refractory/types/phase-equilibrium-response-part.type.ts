import type { PhasePartSource } from '../enums/phase-part-source.enum';
import type { UnreactedPhaseState } from '../enums/unreacted-phase-state.enum';
import type { PhaseEquilibriumGlassPoints } from './phase-equilibrium-glass-points.type';
import type { PhaseEquilibriumViscosity } from './phase-equilibrium-viscosity.type';

/** Part of a liquid or glass total: matrix liquid or an unreacted glass remainder. */
export type PhaseEquilibriumResponsePart = {
  /** Reacted matrix or unreacted grain core */
  source: PhasePartSource;

  /** Display name */
  name: string;

  /** Amount [% of the fired body] */
  percent: number;

  /** Mass [kg] */
  mass: number;

  /** Composition [wt%] */
  composition: Record<string, number>;

  /** Material of an unreacted part */
  materialId?: string;

  /** Phase of an unreacted part */
  phaseId?: string;

  /** State of an unreacted part */
  state?: UnreactedPhaseState;

  /** Viscosity at T; null when no model applies */
  viscosity?: PhaseEquilibriumViscosity | null;

  /** Glass points; null for slag models or when unavailable */
  glassPoints?: PhaseEquilibriumGlassPoints | null;
};
