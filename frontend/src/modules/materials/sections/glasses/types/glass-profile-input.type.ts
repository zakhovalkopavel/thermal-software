import type { GlassModel } from './glass-model.type';

export type GlassProfileInput = {
  /** wt% */
  composition: Record<string, number>;
  temperatures_C: number[];
  model?: GlassModel;
};
