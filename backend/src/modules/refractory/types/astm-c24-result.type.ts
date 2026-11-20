/** ASTM C24 Pyrometric Cone Equivalent (PCE) result. */
export type ASTMC24Result = {
  standard: 'ASTM_C24';

  /** PCE cone number */
  coneNumber: number;

  /** Equivalent temperature (°C) */
  equivalentTemperature_C: number;

  /** Cone melting point (°C) */
  coneMeltingPoint_C: number;

  /** Temperature range for cone (°C) */
  temperatureRange: { min: number; max: number };

  /** Description */
  description: string;
};
