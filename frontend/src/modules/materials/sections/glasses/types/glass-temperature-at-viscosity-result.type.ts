import type { GlassValidation } from './glass-validation.type';
import type { GlassVtfParameters } from './glass-vtf-parameters.type';

export type GlassTemperatureAtViscosityResult = {
  model: string;
  targetLogEta: number;
  temperature_C: number;
  vtfParameters?: GlassVtfParameters;
  validation: GlassValidation;
};
