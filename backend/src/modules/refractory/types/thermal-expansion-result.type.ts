import type { WeightedThermalProperty } from './weighted-thermal-property.type';

/** Thermal expansion result. */
export type ThermalExpansionResult = {
  /** Linear expansion coefficient (1/K at temperature) */
  linearExpansionCoefficient_1perK: number;

  /** Average expansion coefficient over range (1/K) */
  averageExpansionCoefficient_1perK?: number;

  /** Volumetric expansion coefficient (1/K) */
  volumetricExpansionCoefficient_1perK: number;

  /** Length change from reference (%) */
  lengthChange_percent?: number;

  /** Reference temperature (°C) */
  referenceTemperature: number;

  /** Current temperature (°C) */
  temperature: number;

  /** Composition-weighted components */
  componentContributions: WeightedThermalProperty[];

  /** Calculation model used */
  model: 'linear' | 'polynomial' | 'exponential';
};
