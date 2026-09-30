import type { CondensedFuelSupply } from './condensed-fuel-supply.type';

export type SolidDirectInput = CondensedFuelSupply & {
  kExcessAir: number;
  tAir_K: number;
  heatLoss_W?: number;
};
