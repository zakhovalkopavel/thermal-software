/** Duty class classification. */
export type DutyClassification = {
  /** Duty class */
  dutyClass: 'low' | 'intermediate' | 'high';

  /** Temperature limit (°C) */
  temperatureLimit_C: number;

  /** Refractoriness minimum (°C) */
  minimumRefractoriness_C: number;

  /** Typical applications */
  applications: string[];

  /** Notes about classification */
  notes?: string;
};
