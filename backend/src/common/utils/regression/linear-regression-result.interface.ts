export interface LinearRegressionResult {
  /** Slope */
  slope: number;
  /** Intercept */
  intercept: number;
  /** R² coefficient of determination */
  r2: number;
  predict(x: number): number;
}
