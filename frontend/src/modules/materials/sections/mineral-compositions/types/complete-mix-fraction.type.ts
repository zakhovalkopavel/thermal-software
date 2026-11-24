import type { MixFraction } from './mix-fraction.type';

export type CompleteMixFraction = MixFraction & {
  materialId: string;
  dMin_mm: number;
  dMax_mm: number;
  d50_mm: number;
  massPercent: number;
  density_kgm3: number;
};
