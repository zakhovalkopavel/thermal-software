import { MetalMaterial } from '../enums/metal-material.enum';
import { MetalEmissivityCoefficients } from './metal-emissivity-coefficients.type';
import { MetalLambdaCoefficients } from './metal-lambda-coefficients.type';

/** Full thermal property record for a metal material. */
export type MetalThermalEntry = {
  materialId: MetalMaterial;
  name: string;
  description: string;
  lambda: MetalLambdaCoefficients;
  emissivity: MetalEmissivityCoefficients;
};
