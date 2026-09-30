import type { OxideComposition } from '../../../types/oxide-composition.type';
import type { RefractorinessStandard } from './refractoriness-standard.type';

export type RefractorinessInput = {
  composition: OxideComposition;
  standard: RefractorinessStandard;
  /** °C; required by the backend validation despite being documented as optional. */
  testTemperature: number;
};
