import type { CondensedFuelSelection } from './condensed-fuel-selection.type';

/** Exactly one of mFuel_kgs / fPower_W. */
export type CondensedFuelSupply = CondensedFuelSelection & {
  mFuel_kgs?: number;
  fPower_W?: number;
};
