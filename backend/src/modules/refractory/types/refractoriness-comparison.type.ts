/** Comparison of refractoriness across standards. */
export type RefractorinessComparison = {
  /** Composition being compared */
  composition: Record<string, number>;

  /** Base refractoriness (°C) */
  baseRefractoriness_C: number;

  /** ISO 1893 T2 equivalent (°C) */
  iso1893T2_C?: number;

  /** ASTM C24 equivalent (°C) */
  astmC24_C?: number;

  /** GOST 4069 equivalent (°C) */
  gost4069_C?: number;

  /** Maximum difference between standards (°C) */
  maxDifference_C?: number;

  /** Notes about differences */
  notes?: string[];
};
