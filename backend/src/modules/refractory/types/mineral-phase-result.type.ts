import type { MineralPhaseData } from './mineral-phase-data.type';
import type { MineralPhaseMetadata } from './mineral-phase-metadata.type';

/** Complete mineral phase identification result. */
export type MineralPhaseResult = {
  /** Identified mineral phases */
  phases: MineralPhaseData[];

  /** Total number of phases identified */
  phaseCount: number;

  /** Composition analyzed */
  composition: Record<string, number>;

  /** Temperature used (°C) */
  temperature: number;

  /** Dominant phase */
  dominantPhase?: MineralPhaseData;

  /** Eutectic phases (if detected) */
  eutecticPhases?: MineralPhaseData[];

  /** Secondary phases (minor constituents) */
  secondaryPhases?: MineralPhaseData[];

  /** Metadata */
  metadata: MineralPhaseMetadata;

  /** Warnings or notes */
  warnings: string[];
};
