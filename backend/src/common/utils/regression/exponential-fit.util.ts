import { ExponentialFitResult } from './exponential-fit-result.interface';

/**
 * Fit y = A·eᴮˣ using linearisation (ln y = ln A + B·x).
 * Equivalent to: scipy.optimize.curve_fit with f=lambda x,A,B: A*np.exp(B*x)
 * — but faster because it uses the closed-form log-linear solution.
 *
 * ⚠️  All y values must be positive.
 */
export function exponentialFit(x: number[], y: number[]): ExponentialFitResult {
  const { ExponentialRegression } = require('ml-regression') as {
    ExponentialRegression: new (x: number[], y: number[]) => {
      A: number; B: number; r2: number; predict(x: number): number;
    };
  };
  const m = new ExponentialRegression(x, y);
  return { A: m.A, B: m.B, r2: m.r2, predict: (v) => m.predict(v) };
}
