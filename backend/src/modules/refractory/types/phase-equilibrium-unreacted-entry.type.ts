import type { PhaseEquilibriumUnreactedPhase } from './phase-equilibrium-unreacted-phase.type';

/** Unreacted phase before the mass-dependent fields are derived. */
export type PhaseEquilibriumUnreactedEntry = Omit<
  PhaseEquilibriumUnreactedPhase,
  'originalMass' | 'unreactedMass' | 'unreactedShare'
>;
