export interface ExponentialFitResult {
  /** Pre-exponential factor A in y = A·eᴮˣ */
  A: number;
  /** Exponential rate B in y = A·eᴮˣ */
  B: number;
  /** R² coefficient of determination */
  r2: number;
  predict(x: number): number;
}
