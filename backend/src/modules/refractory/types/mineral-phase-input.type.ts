/** Mineral phase identification input. */
export type MineralPhaseInput = {
  /** Oxide composition (Record with component names and wt%) */
  composition: Record<string, number>;

  /** Temperature (°C) */
  temperature: number;

  /** Include detailed phase properties */
  includeDetails?: boolean;

  /** Sort results by criteria */
  sortBy?: 'name' | 'percentage' | 'meltingPoint';
};
