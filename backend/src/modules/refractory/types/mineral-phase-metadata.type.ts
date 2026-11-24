/** Metadata for mineral phase identification. */
export type MineralPhaseMetadata = {
  /** Calculation timestamp */
  calculatedAt: Date;

  /** Number of phases detected */
  phasesDetected: number;

  /** Total percentage explained by identified phases */
  percentageExplained: number;

  /** Calculation method */
  method: 'stoichiometric' | 'phase-diagram-based';

  /** Phase diagram reference system */
  referenceSystem?: string;

  /** Confidence level (0-1) */
  confidence: number;

  /** Model version */
  modelVersion: string;

  /** Temperature-dependent phase transitions */
  phaseTransitions?: Array<{
    phase: string;
    transitionTemperature_C: number;
    description: string;
  }>;
};
