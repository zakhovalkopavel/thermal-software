/** Eutectic point definition (phase-equilibrium domain). */
export type EutecticPoint = {
  /** Eutectic temperature (°C) */
  temperature: number;

  /** Eutectic composition (Record with component wt%) */
  composition: Record<string, number>;

  /** Description */
  description: string;
};
