import type { MineralPhaseData } from './mineral-phase-data.type';

/** Phase comparison at different temperatures. */
export type PhaseTemperatureComparison = {
  /** Composition analyzed */
  composition: Record<string, number>;

  /** Temperature points compared */
  temperatures_C: number[];

  /** Phase distribution at each temperature */
  phaseDistributions: Array<{
    temperature_C: number;
    phases: MineralPhaseData[];
    dominant: string;
  }>;

  /** Phase transitions occurring */
  transitionsObserved: Array<{
    fromPhase: string;
    toPhase: string;
    transitionTemperature_C: number;
  }>;
};
