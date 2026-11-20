/** Metadata for thermal performance calculation. */
export type ThermalPerformanceMetadata = {
  /** Calculation timestamp */
  calculatedAt: Date;

  /** Porosity used (if applicable) */
  porosity?: number;

  /** Bulk density used (if applicable) */
  bulkDensity_kgm3?: number;

  /** Reference temperature (°C) */
  referenceTemperature: number;

  /** Calculation method/model used */
  method: string;

  /** Data source */
  dataSource: 'literature' | 'model' | 'experimental' | 'hybrid';

  /** Confidence level (0-1) */
  confidence: number;
};
