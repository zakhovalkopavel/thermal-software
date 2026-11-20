import type { MineralPhase } from '../types/mineral-phase.type';
import type { PhaseData } from '../types/phase-data.type';
import type { PhaseEquilibriumInput } from '../types/phase-equilibrium-input.type';
import type { PhaseEquilibriumResult } from '../types/phase-equilibrium-result.type';

/**
 * Runtime type guards for phase-equilibrium shapes.
 * Stateless — no DI.
 */
export class PhaseEquilibriumTypeGuards {
  static isPhaseEquilibriumInput(obj: any): obj is PhaseEquilibriumInput {
    return (
      typeof obj === 'object' &&
      typeof obj.composition === 'object' &&
      typeof obj.temperature === 'number'
    );
  }

  static isPhaseData(obj: any): obj is PhaseData {
    return (
      typeof obj === 'object' &&
      typeof obj.percent === 'number' &&
      typeof obj.mass === 'number' &&
      typeof obj.composition === 'object' &&
      Array.isArray(obj.components)
    );
  }

  static isMineralPhase(obj: any): obj is MineralPhase {
    return (
      typeof obj === 'object' &&
      typeof obj.phase === 'string' &&
      typeof obj.formula === 'string' &&
      typeof obj.percent === 'number' &&
      typeof obj.meltingPoint === 'number'
    );
  }

  static isPhaseEquilibriumResult(obj: any): obj is PhaseEquilibriumResult {
    return (
      typeof obj === 'object' &&
      PhaseEquilibriumTypeGuards.isPhaseData(obj.liquid) &&
      PhaseEquilibriumTypeGuards.isPhaseData(obj.solid) &&
      typeof obj.metadata === 'object' &&
      Array.isArray(obj.warnings)
    );
  }
}
