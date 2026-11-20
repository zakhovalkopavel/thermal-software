/** Single mineral phase information (identification domain). */
export type MineralPhaseData = {
  /** Phase name (e.g., Mullite, Corundum) */
  phaseName: string;

  /** Chemical formula */
  formula: string;

  /** Crystal structure type */
  crystalStructure: string;

  /** Melting point (°C) */
  meltingPoint_C: number;

  /** Estimated percentage in solid */
  estimatedPercent: number;

  /** Phase stability range */
  stabilityRange?: {
    minTemperature_C: number;
    maxTemperature_C: number;
  };

  /** Density (g/cm³) */
  density_gcm3?: number;

  /** Hardness (Mohs scale or HV) */
  hardness?: number | string;

  /** Physical properties */
  properties: string[];

  /** Notes about phase */
  notes?: string;
};
