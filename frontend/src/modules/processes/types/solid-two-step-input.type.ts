import type { CondensedFuelSupply } from './condensed-fuel-supply.type';

export type SolidTwoStepInput = CondensedFuelSupply & {
  kExcessAir: number;
  primaryExcessAir?: number;
  tAirPrimary_K: number;
  tAirSecondary_K?: number;
  generatorHeatLoss_W?: number;
  generatorHeatFlux_Wm2?: number;
  generatorSurface_m2?: number;
  furnaceHeatLoss_W?: number;
};
