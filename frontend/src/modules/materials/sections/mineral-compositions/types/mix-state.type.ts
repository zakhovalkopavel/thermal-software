import type { MixFraction } from './mix-fraction.type';

export type MixState = {
  fractions: MixFraction[];
  /** Packing fraction φ chosen on the Packing tab (or typed on the Water tab). */
  phi: number | null;
  /** Green porosity 0–1 from the same packing result. */
  porosity: number | null;
};
