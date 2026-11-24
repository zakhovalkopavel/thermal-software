import type { CondensedFuel } from './condensed-fuel.type';

export type FluidFuelInput = {
  phase: 'gas' | 'liquid';
  /** Gas: exactly one of fuelId / fuelGas. */
  fuelId?: string;
  fuelGas?: Record<string, number>;
  /** Liquid: required. */
  fuel?: CondensedFuel;
  mFuel_kgs?: number;
  fPower_W?: number;
  kExcessAir: number;
  tAir_K: number;
  tFuel_K?: number;
  pO2?: number;
  wH2Om?: number;
  heatLoss_W?: number;
};
