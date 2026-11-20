import type { MineralPhaseData } from '../types/mineral-phase-data.type';
import type { MineralPhaseInput } from '../types/mineral-phase-input.type';
import type { MineralPhaseResult } from '../types/mineral-phase-result.type';
import type { PhaseDistribution } from '../types/phase-distribution.type';
import type { PhaseStability } from '../types/phase-stability.type';

/**
 * Runtime type guards for mineral-phase identification shapes.
 * Stateless — no DI.
 */
export class MineralPhaseTypeGuards {
  static isMineralPhaseInput(obj: any): obj is MineralPhaseInput {
    return (
      typeof obj === 'object' &&
      typeof obj.composition === 'object' &&
      typeof obj.temperature === 'number'
    );
  }

  static isMineralPhaseData(obj: any): obj is MineralPhaseData {
    return (
      typeof obj === 'object' &&
      typeof obj.phaseName === 'string' &&
      typeof obj.formula === 'string' &&
      typeof obj.meltingPoint_C === 'number' &&
      typeof obj.estimatedPercent === 'number' &&
      Array.isArray(obj.properties)
    );
  }

  static isMineralPhaseResult(obj: any): obj is MineralPhaseResult {
    return (
      typeof obj === 'object' &&
      Array.isArray(obj.phases) &&
      obj.phases.every(MineralPhaseTypeGuards.isMineralPhaseData) &&
      typeof obj.phaseCount === 'number' &&
      typeof obj.composition === 'object' &&
      typeof obj.metadata === 'object' &&
      Array.isArray(obj.warnings)
    );
  }

  static isPhaseDistribution(obj: any): obj is PhaseDistribution {
    return (
      typeof obj === 'object' &&
      typeof obj.primary === 'object' &&
      Array.isArray(obj.secondary)
    );
  }

  static isPhaseStability(obj: any): obj is PhaseStability {
    return (
      typeof obj === 'object' &&
      typeof obj.phase === 'string' &&
      typeof obj.stableAtTemperature === 'boolean' &&
      typeof obj.stabilityRange === 'object'
    );
  }
}
