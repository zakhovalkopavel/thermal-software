import { PHASE_EQUILIBRIUM_CONSTANTS } from '../constants/phase-equilibrium.constants';
import { UNREACTED_PHASE_CONSTANTS } from '../constants/unreacted-phase.constants';
import { UnreactedPhaseState } from '../enums/unreacted-phase-state.enum';
import type { MeltPropertyBundle } from '../types/melt-property-bundle.type';
import type { PhaseEquilibriumUnreactedPhase } from '../types/phase-equilibrium-unreacted-phase.type';

/**
 * Attaches η(T) and glass points to unreacted amorphous cores, and sets
 * `softened` when log₁₀ η at T is below the annealing threshold.
 */
export class UnreactedGlassViscosity {
  static attach(
    unreacted: PhaseEquilibriumUnreactedPhase[],
    evaluate: (composition: Record<string, number>) => MeltPropertyBundle,
  ): { phases: PhaseEquilibriumUnreactedPhase[]; warnings: string[] } {
    const warnings: string[] = [];
    const phases = unreacted.map(phase => {
      if (phase.phaseId !== UNREACTED_PHASE_CONSTANTS.glassPhaseId) return phase;
      if (!phase.composition || Object.keys(phase.composition).length === 0) {
        return { ...phase, viscosity: null, glassPoints: null };
      }
      try {
        const bundle = evaluate(phase.composition);
        const softened =
          bundle.viscosity != null &&
          bundle.viscosity.logViscosity < PHASE_EQUILIBRIUM_CONSTANTS.annealingLogViscosity;
        return {
          ...phase,
          viscosity: bundle.viscosity,
          glassPoints: bundle.glassPoints,
          state: softened ? UnreactedPhaseState.SOFTENED : phase.state,
        };
      } catch (error) {
        warnings.push(
          `Viscosity of unreacted glass (${phase.materialId}) not available: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        return { ...phase, viscosity: null, glassPoints: null };
      }
    });
    return { phases, warnings };
  }
}
