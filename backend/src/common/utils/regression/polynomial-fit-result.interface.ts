export interface PolynomialFitResult {
  /** Coefficients [c0, c1, …, cn] where y = c0 + c1·x + c2·x² + … */
  coefficients: number[];
  /** R² coefficient of determination */
  r2: number;
  predict(x: number): number;
}
