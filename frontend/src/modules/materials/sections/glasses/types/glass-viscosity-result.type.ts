import type { GlassFixedPoints } from './glass-fixed-points.type';
import type { GlassValidation } from './glass-validation.type';

export type GlassViscosityResult = {
  viscosity_Pas: number;
  temperature_C: number;
  logViscosity: number;
  model: { systemName: string; parameters?: Record<string, unknown> };
  fixedPoints?: GlassFixedPoints | null;
  validation: GlassValidation;
  composition: Record<string, number>;
};
