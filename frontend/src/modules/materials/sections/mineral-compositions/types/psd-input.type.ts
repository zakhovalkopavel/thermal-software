import type { PsdFractionInput } from './psd-fraction-input.type';

export type PsdInput = {
  fractions: PsdFractionInput[];
  q: number;
  Dmin_mm?: number;
  Dmax_mm?: number;
};
