import type { BoilingPointSource } from './boiling-point-source.type';

export type CompoundLiquidBounds = {
  id: string;
  cas: string | null;
  name: string;
  formula: string;
  displayFormula: string;
  P_Pa: number;
  capable: boolean;
  Tmin_K: number | null;
  Tmax_K: number | null;
  meltingPoint_K: number | null;
  boilingPoint_K: number | null;
  boilingPointSource: BoilingPointSource | null;
  normalBoilingPoint_K: number | null;
  message?: string;
};
