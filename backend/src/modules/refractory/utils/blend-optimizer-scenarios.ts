/**
 * Lookups and validators for blend-optimizer compaction / PSD / packing options.
 * Stateless — no DI.
 */
import { BLEND_OPTIMIZER_CONSTANTS } from '../constants/blend-optimizer.constants';

type CompactionScenario =
  (typeof BLEND_OPTIMIZER_CONSTANTS.COMPACTION_SCENARIOS)[number];
type PsdMethod = (typeof BLEND_OPTIMIZER_CONSTANTS.PSD_METHODS)[number];
type PackingModel = (typeof BLEND_OPTIMIZER_CONSTANTS.PACKING_MODELS)[number];

export class BlendOptimizerScenarios {
  /** Compaction index K for a scenario (default Vibratable). */
  static compactionIndex(scenario: string): number {
    const map = BLEND_OPTIMIZER_CONSTANTS.COMPACTION_INDICES;
    return map[scenario as CompactionScenario] ?? map['Vibratable'];
  }

  /** Compaction pressure [MPa] for a scenario (default Vibratable). */
  static compactionPressure(scenario: string): number {
    const map = BLEND_OPTIMIZER_CONSTANTS.COMPACTION_PRESSURES_MPA;
    return map[scenario as CompactionScenario] ?? map['Vibratable'];
  }

  /** q-value min/max for a scenario (default Vibratable). */
  static qValueConstraints(scenario: string): { min: number; max: number } {
    const map = BLEND_OPTIMIZER_CONSTANTS.Q_VALUE_CONSTRAINTS;
    return map[scenario as CompactionScenario] ?? map['Vibratable'];
  }

  /** Human-readable description for a scenario. */
  static scenarioDescription(scenario: string): string {
    const map = BLEND_OPTIMIZER_CONSTANTS.SCENARIO_DESCRIPTIONS;
    return map[scenario as CompactionScenario] ?? 'Unknown scenario';
  }

  static isValidScenario(scenario: string): boolean {
    return (BLEND_OPTIMIZER_CONSTANTS.COMPACTION_SCENARIOS as readonly string[])
      .includes(scenario);
  }

  static isValidPsdMethod(method: string): boolean {
    return (BLEND_OPTIMIZER_CONSTANTS.PSD_METHODS as readonly string[])
      .includes(method);
  }

  static isValidPackingModel(model: string): boolean {
    return (BLEND_OPTIMIZER_CONSTANTS.PACKING_MODELS as readonly string[])
      .includes(model);
  }
}
