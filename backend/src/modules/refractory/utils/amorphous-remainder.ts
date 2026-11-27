import { PHASE_EQUILIBRIUM_CONSTANTS } from '../constants/phase-equilibrium.constants';
import type { MaterialMineralogy } from '../types/material-mineralogy.type';
import { PhaseCatalog } from './phase-catalog';

/** Oxide remainder of a material after subtracting crystalline mineralogy phases. */
export class AmorphousRemainder {
  /**
   * Fired-basis oxide remainder [wt% of the material] and its total share.
   * Throws when any oxide goes more negative than the mineralogy tolerance.
   */
  static of(
    composition: Record<string, number>,
    mineralogy: MaterialMineralogy,
  ): { composition: Record<string, number>; amorphous_wt: number } {
    const used: Record<string, number> = {};
    for (const phase of mineralogy.phases) {
      const entry = PhaseCatalog.get(phase.phaseId);
      if (!entry) throw new Error(`Unknown mineralogy phaseId "${phase.phaseId}"`);
      if (entry.inert) continue;
      const oxides = PhaseCatalog.oxideComposition_wt(phase.phaseId);
      if (!oxides) throw new Error(`Mineralogy phaseId "${phase.phaseId}" has no oxide stoichiometry`);
      for (const [oxide, wtPct] of Object.entries(oxides)) {
        used[oxide] = (used[oxide] ?? 0) + (phase.wt * wtPct) / 100;
      }
    }
    const remainder: Record<string, number> = {};
    const keys = new Set([...Object.keys(composition), ...Object.keys(used)]);
    const tol = PHASE_EQUILIBRIUM_CONSTANTS.mineralogyRemainderTolerance_wt;
    for (const key of keys) {
      const value = (composition[key] ?? 0) - (used[key] ?? 0);
      if (value < -tol) {
        throw new Error(
          `Mineralogy over-allocates ${key} by ${(-value).toFixed(2)} wt% (tolerance ${tol} wt%)`,
        );
      }
      if (value > 0) remainder[key] = value;
    }
    const amorphous_wt = Object.values(remainder).reduce((sum, v) => sum + v, 0);
    return { composition: remainder, amorphous_wt };
  }
}
