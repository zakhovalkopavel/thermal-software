import type { PhaseEquilibriumGlassPoints } from './phase-equilibrium-glass-points.type';
import type { PhaseEquilibriumViscosity } from './phase-equilibrium-viscosity.type';

/** One liquid or glass contribution: matrix melt or an unreacted grain-core remainder. */
export type PhaseEquilibriumPart = {
  /** `matrix` = reacted equilibrium; `unreacted` = grain core */
  source: 'matrix' | 'unreacted';
  name: string;
  percent: number;
  mass: number;
  /** wt% */
  composition: Record<string, number>;
  materialId?: string;
  phaseId?: string;
  /** Unreacted core state when present */
  state?: 'unchanged' | 'softened' | 'transformed';
  /** At-temperature viscosity; null when no model applies */
  viscosity?: PhaseEquilibriumViscosity | null;
  /** Glass points; null for slag models or liquid at T */
  glassPoints?: PhaseEquilibriumGlassPoints | null;
};
