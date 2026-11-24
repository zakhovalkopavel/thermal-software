import type { TemperatureDependentProperty } from './temperature-dependent-property.type';

/** Property curve (multiple temperatures). */
export type PropertyCurve = {
  /** Property name */
  property: string;

  /** Unit of property */
  unit: string;

  /** Data points */
  data: TemperatureDependentProperty[];

  /** Curve fit type */
  fitType?: 'linear' | 'polynomial' | 'exponential' | 'spline';

  /** R² value for fit */
  r2?: number;
};
