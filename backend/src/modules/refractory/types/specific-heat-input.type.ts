import type { ThermalInput } from './thermal-input.type';

/** Specific heat capacity calculation input. */
export type SpecificHeatInput = ThermalInput & {
  /** Heat capacity model to use */
  model?: 'polynomial' | 'linear' | 'constant';
};
