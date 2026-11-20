/** Glass processing window. */
export type GlassProcessingWindow = {
  /** Window name */
  name: string;

  /** Temperature range (°C) */
  temperatureRange: { min: number; max: number };

  /** Viscosity range (Pa·s) */
  viscosityRange: { min: number; max: number };

  /** Processing method suitable for this window */
  processMethod: string;

  /** Notes about processing */
  notes?: string;
};
