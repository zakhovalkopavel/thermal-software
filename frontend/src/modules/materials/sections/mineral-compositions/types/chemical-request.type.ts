import type { OxideComposition } from '../../../types/oxide-composition.type';
import type { RefractorinessStandard } from './refractoriness-standard.type';

export type ChemicalRequest = {
  /** `acceptedOxides_normalized` of the mix. */
  composition: OxideComposition;
  /** °C */
  temperature: number;
  totalMass: number;
  standard: RefractorinessStandard;
  testTemperature: number;
  /** 0–1 */
  porosity: number;
  /** °C grid of the liquid-fraction and λ_eff sweeps. */
  grid: number[];
};
