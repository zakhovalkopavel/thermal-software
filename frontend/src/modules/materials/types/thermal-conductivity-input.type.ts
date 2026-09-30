import type { OxideComposition } from './oxide-composition.type';

export type ThermalConductivityInput = {
  composition: OxideComposition;
  /** °C */
  temperature: number;
  /** 0–1 */
  porosity?: number;
};
