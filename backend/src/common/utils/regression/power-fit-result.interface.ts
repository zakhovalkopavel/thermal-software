export interface PowerFitResult {
  /** Coefficient A in y = A·xᴮ */
  A: number;
  /** Exponent B in y = A·xᴮ */
  B: number;
  /** R² coefficient of determination */
  r2: number;
  predict(x: number): number;
}
