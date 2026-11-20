import type { MineralPhase } from './mineral-phase.type';
import type { PhaseData } from './phase-data.type';

/** Solid phase data (extends PhaseData with mineral phases). */
export type SolidPhaseData = PhaseData & {
  /** Identified mineral phases in solid */
  mineralPhases: MineralPhase[];
};
