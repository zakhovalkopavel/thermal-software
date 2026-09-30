import type { GlassModel } from './glass-model.type';

export type GlassTemperatureAtViscosityInput = {
  /** wt% */
  composition: Record<string, number>;
  /** log₁₀(η / Pa·s) */
  targetLogEta: number;
  model?: GlassModel;
};
