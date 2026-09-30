import type { TemperatureRange } from './temperature-range.type';

export type MetalSummary = {
  materialId: string;
  name: string;
  description: string;
  emissivityRange_K: TemperatureRange;
};
