import { PHASE_EQUILIBRIUM_RESPONSE_CONSTANTS } from '../constants/phase-equilibrium-response.constants';
import type { LegacyVariant } from '../enums/legacy-variant.enum';
import type { PhaseEquilibriumComparison } from '../types/phase-equilibrium-comparison.type';
import type { PhaseEquilibriumEngineResult } from '../types/phase-equilibrium-engine-result.type';

/** Side-by-side comparison of the CALPHAD and the legacy engine result. */
export class EngineComparison {
  /**
   * @param legacy Legacy result; null when the legacy side could not run
   * @param unavailableReason Reason of the missing legacy result
   */
  static build(
    calphad: PhaseEquilibriumEngineResult,
    legacy: PhaseEquilibriumEngineResult | null,
    legacyVariant: LegacyVariant,
    unavailableReason?: string,
  ): PhaseEquilibriumComparison {
    const calphadPhaseIds = calphad.crystals.map(c => c.phaseId);
    const legacyPhaseIds = legacy ? legacy.crystals.map(c => c.phaseId) : [];
    return {
      legacyVariant,
      calphadLiquidPercent: EngineComparison.round(calphad.liquidPercent),
      legacyLiquidPercent: legacy ? EngineComparison.round(legacy.liquidPercent) : null,
      liquidPercentDelta: legacy ? EngineComparison.round(legacy.liquidPercent - calphad.liquidPercent) : null,
      calphadPhaseIds,
      legacyPhaseIds,
      commonPhaseIds: calphadPhaseIds.filter(id => legacyPhaseIds.includes(id)),
      ...(unavailableReason ? { legacyUnavailableReason: unavailableReason } : {}),
    };
  }

  private static round(value: number): number {
    return Number(value.toFixed(PHASE_EQUILIBRIUM_RESPONSE_CONSTANTS.decimals));
  }
}
