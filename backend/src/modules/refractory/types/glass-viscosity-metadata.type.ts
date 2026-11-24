import type { ConfidenceLevel, ViscosityModelType } from '../enums';

/** Metadata for glass viscosity calculation. */
export type GlassViscosityMetadata = {
  /** Calculation timestamp */
  calculatedAt: Date;

  /** Model type used */
  modelType: ViscosityModelType;

  /** ASTM standard */
  standard: 'ASTM_C965_96';

  /** Confidence level */
  confidence: ConfidenceLevel;

  /** Reference for model parameters */
  reference: string;

  /** Version of algorithm */
  version: string;
};
