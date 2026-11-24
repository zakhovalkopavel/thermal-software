import type { FuelPhase } from './fuel-phase.type';

export type FuelSummary = {
  id: string;
  name: string;
  phase: FuelPhase;
  lhv_Jkg: number;
  heatOfFormation_Jkg: number;
  /** Gas presets only. */
  moleFractions?: Record<string, number>;
  stoichAir_kgkg: number;
};
