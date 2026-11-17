import type { BoilingPointSource } from './boiling-point-source.type';

export type CompoundGasBounds = {
  id: string;
  cas: string | null;
  name: string;
  formula: string;
  displayFormula: string;
  P_Pa: number;
  Tmin_K: number | null;
  Tmax_K: number | null;
  boilingPoint_K: number | null;
  boilingPointSource: BoilingPointSource | null;
  normalBoilingPoint_K: number | null;
  message?: string;
};
