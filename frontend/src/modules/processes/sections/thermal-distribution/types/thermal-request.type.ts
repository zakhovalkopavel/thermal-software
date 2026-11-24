import type { BcType } from './bc-type.type';
import type { InitialProfile } from './initial-profile.type';
import type { ThermalShapeInput } from './thermal-shape-input.type';

/** ProfileRequestDto; temperatures in °C, τ in s. */
export type ThermalRequest = {
  bcType: BcType;
  Tc: number;
  T0: number;
  tau: number;
  alpha?: number;
  lambda: number;
  thermalDiffusivity: number;
  shape: ThermalShapeInput;
  initialProfile?: InitialProfile;
  T0Ctr?: number;
  T0Surf?: number;
  biPerAxis?: [number, number, number];
  biCylinder?: [number, number];
  seriesTerms?: number;
};
