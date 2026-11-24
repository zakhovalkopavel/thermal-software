/** Optional parameters for PSD calculation. */
export type PSDCalculationOptions = {
  /** Minimum diameter override (mm) — if not provided, uses smallest dMin_mm */
  Dmin_mm?: number;

  /** Maximum diameter override (mm) — if not provided, uses largest dMax_mm */
  Dmax_mm?: number;
};
