import type { GlassFixedPoints } from './glass-fixed-points.type';
import type { GlassValidation } from './glass-validation.type';
import type { GlassViscosityPoint } from './glass-viscosity-point.type';
import type { GlassVtfParameters } from './glass-vtf-parameters.type';

export type GlassProfileResult = {
  model: string;
  modelRef?: string;
  vtfParameters?: GlassVtfParameters;
  points: GlassViscosityPoint[];
  /** `null` for Hetherington and slag models. */
  fixedPoints: GlassFixedPoints | null;
  validation: GlassValidation;
};
