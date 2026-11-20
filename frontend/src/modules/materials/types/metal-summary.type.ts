import type { TemperatureRange } from './temperature-range.type';

export type MetalSummary = {
  materialId: string;
  name: string;
  description: string;
  group?: string;
  family?: string;
  availableProperties?: string[];
  hasDonorFill?: boolean;
  /** Present only for poly grades that define ε. */
  emissivityRange_K?: TemperatureRange;
};
