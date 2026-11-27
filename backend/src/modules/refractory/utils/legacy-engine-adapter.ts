import { LEGACY_ENGINE_ADAPTER_CONSTANTS } from '../constants/legacy-engine-adapter.constants';
import { ConfidenceLevel } from '../enums/confidence-level.enum';
import { PhaseEquilibriumMethod } from '../enums/phase-equilibrium-method.enum';
import type { PhaseEquilibriumCrystal } from '../types/phase-equilibrium-crystal.type';
import type { PhaseEquilibriumEngineResult } from '../types/phase-equilibrium-engine-result.type';
import type { PhaseEquilibriumLegacyResult } from '../types/phase-equilibrium-legacy-result.type';

/** Converts the legacy eutectic result to the common engine result. */
export class LegacyEngineAdapter {
  static toEngineResult(legacy: PhaseEquilibriumLegacyResult): PhaseEquilibriumEngineResult {
    return {
      liquidPercent: legacy.liquid.percent,
      solidPercent: legacy.solid.percent,
      liquidComposition: legacy.liquid.composition,
      solidComposition: legacy.solid.composition,
      solidus_C: legacy.metadata.eutecticTemperature,
      liquidus_C: legacy.metadata.estimatedLiquidus,
      crystals: LegacyEngineAdapter.crystals(legacy.solid.mineralPhases, legacy.solid.percent),
      method: PhaseEquilibriumMethod.LEGACY_EUTECTIC,
      confidence: ConfidenceLevel.LOW,
      warnings: legacy.warnings,
      status: 'estimated',
    };
  }

  /** Legacy phase names (`Corundum (α-Al₂O₃)`) → crystals sharing the solid equally. */
  private static crystals(names: string[], solidPercent: number): PhaseEquilibriumCrystal[] {
    const phases = names.filter(n => n !== LEGACY_ENGINE_ADAPTER_CONSTANTS.fallbackPhaseName);
    if (solidPercent <= 0 || phases.length === 0) return [];
    return phases.map(name => {
      const match = LEGACY_ENGINE_ADAPTER_CONSTANTS.mineralPhasePattern.exec(name);
      const phase = match ? match[1] : name;
      return {
        phaseId: phase.toLowerCase().split(/\s+/)[0],
        phase,
        formula: match ? match[2].replace(LEGACY_ENGINE_ADAPTER_CONSTANTS.polymorphPrefixPattern, '') : '',
        percent: solidPercent / phases.length,
      };
    });
  }
}
