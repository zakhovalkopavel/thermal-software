/** Base thermal property input. */
export type ThermalInput = {
  /** Oxide composition (Record with component names and wt%) */
  composition: Record<string, number>;

  /** Temperature (°C) */
  temperature: number;

  /** Porosity fraction (0-1) */
  porosity?: number;

  /** Pore size distribution type */
  poreType?: 'open' | 'closed' | 'mixed';
};
