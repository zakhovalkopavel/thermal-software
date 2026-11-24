import type { GlassModel } from './glass-model.type';

export type GlassViscosityInput = {
  /** wt% */
  composition: Record<string, number>;
  /** °C */
  temperature: number;
  model?: GlassModel;
};
