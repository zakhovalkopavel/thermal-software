/** Temperature-dependent property at specific point. */
export type TemperatureDependentProperty = {
  /** Temperature (°C) */
  temperature: number;

  /** Property value at temperature */
  value: number;

  /** Confidence/reliability (0-1) */
  confidence: number;
};
