import type { CondensedFuel } from './condensed-fuel.type';

/** Exactly one of fuelId / fuel. */
export type CondensedFuelSelection = {
  fuelId?: string;
  fuel?: CondensedFuel;
  tFuel_K?: number;
  pO2?: number;
  wH2Om?: number;
};
