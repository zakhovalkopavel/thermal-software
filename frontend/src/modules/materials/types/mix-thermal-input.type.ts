import type { MixComponentInput } from './mix-component-input.type';

export type MixThermalInput = {
  fractions: MixComponentInput[];
  temperatures_C: number[];
  porosity: number;
};
