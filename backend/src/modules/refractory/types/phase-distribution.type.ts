/** Phase distribution analysis. */
export type PhaseDistribution = {
  /** Primary phase and percentage */
  primary: { phase: string; percent: number };

  /** Secondary phases and percentages */
  secondary: Array<{ phase: string; percent: number }>;

  /** Trace phases (< 1%) */
  trace?: Array<{ phase: string; percent: number }>;

  /** Phase relationships (eutectic, peritectic, etc.) */
  relationships?: string[];
};
