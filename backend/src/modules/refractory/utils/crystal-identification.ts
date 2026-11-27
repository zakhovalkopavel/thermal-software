import { CRYSTAL_IDENTIFICATION_RULES } from '../data/crystal-identification-rules.data';
import type { CrystalIdentificationRule } from '../types/crystal-identification-rule.type';
import type { PhaseEquilibriumCrystal } from '../types/phase-equilibrium-crystal.type';

/**
 * Threshold-based identification of the crystalline phases of an oxide solid.
 * Stateless heuristic; the amounts are only roughly proportional to the limiting oxide.
 */
export class CrystalIdentification {
  /**
   * Crystals of a solid.
   *
   * @param solidComposition Solid composition [wt%]
   * @param solidPercent     Solid amount; the crystal percentages sum to this value
   */
  static identify(solidComposition: Record<string, number>, solidPercent: number): PhaseEquilibriumCrystal[] {
    if (solidPercent <= 0 || Object.keys(solidComposition).length === 0) return [];
    const matched = CRYSTAL_IDENTIFICATION_RULES.filter(rule => CrystalIdentification.matches(rule, solidComposition));
    if (matched.length === 0) return CrystalIdentification.dominantOxide(solidComposition, solidPercent);
    const weights = matched.map(rule => solidComposition[rule.weightOxide] ?? 0);
    const total = weights.reduce((sum, w) => sum + w, 0);
    return matched.map((rule, i) => ({
      phaseId: rule.phaseId,
      phase: rule.phase,
      formula: rule.formula,
      percent: (solidPercent * weights[i]) / total,
    }));
  }

  private static matches(rule: CrystalIdentificationRule, comp: Record<string, number>): boolean {
    const contents = Object.entries(rule.minWt).every(([oxide, min]) => (comp[oxide] ?? 0) > min);
    if (!contents || !rule.minRatio) return contents;
    const { numerator, denominator, value } = rule.minRatio;
    return (comp[numerator] ?? 0) / (comp[denominator] ?? 0) > value;
  }

  /** No rule matched: the most abundant oxide is reported as its own crystalline phase. */
  private static dominantOxide(comp: Record<string, number>, solidPercent: number): PhaseEquilibriumCrystal[] {
    const [formula] = Object.entries(comp).sort((a, b) => b[1] - a[1])[0];
    return [{ phaseId: formula.toLowerCase(), phase: formula, formula, percent: solidPercent }];
  }
}
