import { INERT_PHASE_IDS } from '../constants/inert-phase-ids.constants';
import { MIX_COMPOSITION_CONSTANTS } from '../constants/mix-composition.constants';
import type { PhaseEquilibriumFractionState } from '../types/phase-equilibrium-fraction-state.type';
import type { PhaseEquilibriumMatrix } from '../types/phase-equilibrium-matrix.type';

/**
 * Composition of the reacted matrix: the shells of the grains (fired composition × reacted
 * fraction X). Only oxide phases enter the matrix; inert phases (SiC, TiC, …) and other
 * non-oxides stay unreacted.
 */
export class MatrixComposition {
  /** Matrix composition [wt%] and amount [% of the fired body] of all size fractions. */
  static build(states: PhaseEquilibriumFractionState[]): PhaseEquilibriumMatrix {
    const amounts: Record<string, number> = {};
    const inert = new Set<string>();
    const unmodelled = new Set<string>();
    for (const state of states) {
      for (const [key, wt] of Object.entries(state.firedPhases_wt)) {
        if (MatrixComposition.isMatrixKey(key)) {
          amounts[key] = (amounts[key] ?? 0) + state.firedFraction * state.reactedFraction * wt;
        } else if (INERT_PHASE_IDS.includes(key)) inert.add(key);
        else unmodelled.add(key);
      }
    }
    const percent = Object.values(amounts).reduce((sum, v) => sum + v, 0);
    const composition = Object.fromEntries(
      Object.entries(amounts).map(([key, v]) => [key, percent > 0 ? (100 * v) / percent : 0]),
    );
    return { composition, percent, warnings: MatrixComposition.warnings(inert, unmodelled) };
  }

  /** Oxide key that takes part in the matrix equilibrium. */
  static isMatrixKey(key: string): boolean {
    return MIX_COMPOSITION_CONSTANTS.oxideKeyPattern.test(key) && !INERT_PHASE_IDS.includes(key);
  }

  private static warnings(inert: Set<string>, unmodelled: Set<string>): string[] {
    const warnings: string[] = [];
    if (inert.size > 0) warnings.push(`Inert phases stay unreacted: ${[...inert].join(', ')}`);
    if (unmodelled.size > 0) {
      warnings.push(`Non-oxide phases without equilibrium data stay unreacted: ${[...unmodelled].join(', ')}`);
    }
    return warnings;
  }
}
