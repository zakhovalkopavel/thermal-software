import type { RefractorinessStandard } from './refractoriness-standard.type';

/** Metadata for refractoriness calculation. */
export type RefractorinessMetadata = {
  /** Calculation timestamp */
  calculatedAt: Date;

  /** Standards calculated */
  standardsCalculated: RefractorinessStandard[];

  /** Test load pressure (Pa) */
  testLoadPressure_Pa: number;

  /** Base refractoriness temperature (°C) */
  baseRefractoriness_C: number;

  /** Calculation method */
  method: 'component-based' | 'model-based';

  /** Confidence level (0-1) */
  confidence: number;

  /** Model version */
  modelVersion: string;
};
