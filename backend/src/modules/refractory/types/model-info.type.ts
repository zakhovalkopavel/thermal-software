import type { ViscosityModel, ViscosityModelType } from '../enums';
import type { ModelParameters } from './model-parameters.type';

/** Information about the viscosity model used. */
export type ModelInfo = {
  /** Equation type used */
  type: ViscosityModelType;

  /** Glass system detected */
  systemType: ViscosityModel;

  /** Human-readable system name */
  systemName: string;

  /** VFT/Arrhenius parameters */
  parameters: ModelParameters;
};
