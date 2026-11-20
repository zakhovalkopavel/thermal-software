import type { BlendOptimizationResult } from './blend-optimization-result.type';

/** Viable composition range for a group of similar formulations. */
export type ViableCompositionRange = {
  /** Average optimization score for this range */
  score: number;

  /** Number of formulations in this range */
  count: number;

  /** Formulations in this range */
  formulations: BlendOptimizationResult[];

  /** Composition ranges for each component */
  componentRanges: Array<{
    /** Component index */
    index: number;

    /** Component material ID if available */
    materialId?: string;

    /** Minimum mass fraction (%) */
    min: number;

    /** Maximum mass fraction (%) */
    max: number;

    /** Average mass fraction (%) */
    avg: number;

    /** Standard deviation (%) */
    stdDev: number;

    /** Tolerance applied for this component (%) */
    tolerance: number;

    /** Human-readable format: "avg±tolerance%" (e.g., "15±1%") */
    formatted: string;
  }>;

  /** Property ranges for this composition range */
  propertyRanges: {
    density: { min: number; max: number; avg: number };
    porosity: { min: number; max: number; avg: number };
    waterDemand: { min: number; max: number; avg: number };
    packingEfficiency: { min: number; max: number; avg: number };
  };

  /**
   * Summary of viable composition in human-readable format
   * Example: "[15±1% cement, 40±2% fine, 45±5% coarse] is optimal"
   */
  summary: string;
};
