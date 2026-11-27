import type { MaoOxideGRange } from './mao-oxide-g-range.type';

/** Liquid oxide end-member G − HSER entry from Mao 2006 CAS staging. */
export type MaoOxideGEntry = {
  phaseId: string;
  formula: string;
  state: string;
  property: string;
  ranges: MaoOxideGRange[];
};
