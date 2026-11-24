import type { WeightedThermalProperty } from './weighted-thermal-property.type';

/** Specific heat capacity result. */
export type SpecificHeatResult = {
  /** Specific heat capacity (J/kg·K) */
  specificHeat_JkgK: number;

  /** Temperature (°C) */
  temperature: number;

  /** Composition-weighted components */
  componentContributions: WeightedThermalProperty[];

  /** Calculation model used */
  model: 'polynomial' | 'linear' | 'constant';

  /** Temperature range validity */
  validRange: { min: number; max: number };

  /** Accuracy estimate (%) */
  accuracy_percent?: number;
};
