import { UNREACTED_PHASE_CONSTANTS } from '../constants/unreacted-phase.constants';
import { UnreactedPhaseState } from '../enums/unreacted-phase-state.enum';
import type { PhaseEquilibriumFractionState } from '../types/phase-equilibrium-fraction-state.type';
import type { PhaseEquilibriumUnreactedEntry } from '../types/phase-equilibrium-unreacted-entry.type';
import type { PhaseEquilibriumUnreactedPhase } from '../types/phase-equilibrium-unreacted-phase.type';
import { AmorphousRemainder } from './amorphous-remainder';
import { MatrixComposition } from './matrix-composition';
import { PhaseCatalog } from './phase-catalog';

/**
 * Unreacted original phases of the grain cores.
 * Prefer library `mineralogy` when present; otherwise synthesise a dominant-oxide
 * crystal + glassy remainder (or keep inert / non-oxide keys as crystals).
 */
export class UnreactedPhases {
  /** Unreacted phases per material and phase, amounts as % of the fired body. */
  static build(states: PhaseEquilibriumFractionState[], totalMass: number): PhaseEquilibriumUnreactedPhase[] {
    const merged = new Map<string, PhaseEquilibriumUnreactedEntry>();
    for (const state of states) {
      for (const entry of UnreactedPhases.entries(state)) {
        const key = `${entry.materialId}|${entry.phaseId}`;
        const known = merged.get(key);
        if (known) {
          known.originalPercent += entry.originalPercent;
          known.unreactedPercent += entry.unreactedPercent;
        } else merged.set(key, entry);
      }
    }
    return [...merged.values()]
      .filter(e => e.originalPercent > UNREACTED_PHASE_CONSTANTS.minPercent)
      .map(e => ({
        ...e,
        originalMass: (e.originalPercent / 100) * totalMass,
        unreactedMass: (e.unreactedPercent / 100) * totalMass,
        unreactedShare: (100 * e.unreactedPercent) / e.originalPercent,
      }));
  }

  private static entries(state: PhaseEquilibriumFractionState): PhaseEquilibriumUnreactedEntry[] {
    if (state.material.mineralogy) return UnreactedPhases.fromMineralogy(state);
    return UnreactedPhases.synthetic(state);
  }

  private static fromMineralogy(state: PhaseEquilibriumFractionState): PhaseEquilibriumUnreactedEntry[] {
    const { material, firedFraction, reactedFraction } = state;
    const mineralogy = material.mineralogy!;
    const unreactedShare = 1 - reactedFraction;
    const entries: PhaseEquilibriumUnreactedEntry[] = [];
    for (const phase of mineralogy.phases) {
      const catalog = PhaseCatalog.get(phase.phaseId);
      if (!catalog) continue;
      const share = catalog.inert ? 1 : unreactedShare;
      entries.push(
        UnreactedPhases.crystal(state, catalog.phaseId, catalog.phase, catalog.formula, firedFraction * phase.wt, share),
      );
    }
    const amorphous = AmorphousRemainder.of(material.composition, mineralogy);
    if (amorphous.amorphous_wt > UNREACTED_PHASE_CONSTANTS.minPercent) {
      entries.push({
        materialId: material.materialId,
        phaseId: UNREACTED_PHASE_CONSTANTS.glassPhaseId,
        phase: `Glass (${material.name})`,
        formula: material.name,
        originalPercent: firedFraction * amorphous.amorphous_wt,
        unreactedPercent: firedFraction * amorphous.amorphous_wt * unreactedShare,
        state: UnreactedPhaseState.UNCHANGED,
        composition: amorphous.composition,
      });
    }
    return entries;
  }

  private static synthetic(state: PhaseEquilibriumFractionState): PhaseEquilibriumUnreactedEntry[] {
    const { material, firedFraction, reactedFraction, firedPhases_wt } = state;
    const unreactedShare = 1 - reactedFraction;
    const oxides = Object.entries(firedPhases_wt).filter(([key]) => MatrixComposition.isMatrixKey(key));
    const entries: PhaseEquilibriumUnreactedEntry[] = Object.entries(firedPhases_wt)
      .filter(([key]) => !MatrixComposition.isMatrixKey(key))
      .map(([key, wt]) =>
        UnreactedPhases.crystal(state, key.toLowerCase(), key, key, firedFraction * wt, 1),
      );
    if (oxides.length === 0) return entries;
    const [dominant, dominantWt] = oxides.reduce((best, o) => (o[1] > best[1] ? o : best));
    const hasPrimary = dominantWt >= UNREACTED_PHASE_CONSTANTS.dominantOxideMinShare_wt;
    const glassOxides = hasPrimary ? oxides.filter(([key]) => key !== dominant) : oxides;
    if (hasPrimary) {
      const primary = UNREACTED_PHASE_CONSTANTS.primaryPhases[dominant] ?? {
        phaseId: dominant.toLowerCase(),
        phase: dominant,
      };
      entries.push(
        UnreactedPhases.crystal(state, primary.phaseId, primary.phase, dominant, firedFraction * dominantWt, unreactedShare),
      );
    }
    const glassWt = glassOxides.reduce((sum, [, wt]) => sum + wt, 0);
    if (glassWt > 0) {
      entries.push({
        materialId: material.materialId,
        phaseId: UNREACTED_PHASE_CONSTANTS.glassPhaseId,
        phase: `Glass (${material.name})`,
        formula: material.name,
        originalPercent: firedFraction * glassWt,
        unreactedPercent: firedFraction * glassWt * unreactedShare,
        state: UnreactedPhaseState.UNCHANGED,
        composition: Object.fromEntries(glassOxides.map(([key, wt]) => [key, (100 * wt) / glassWt])),
      });
    }
    return entries;
  }

  private static crystal(
    state: PhaseEquilibriumFractionState,
    phaseId: string,
    phase: string,
    formula: string,
    originalPercent: number,
    unreactedShare: number,
  ): PhaseEquilibriumUnreactedEntry {
    return {
      materialId: state.material.materialId,
      phaseId,
      phase,
      formula,
      originalPercent,
      unreactedPercent: originalPercent * unreactedShare,
      state: UnreactedPhaseState.UNCHANGED,
    };
  }
}
