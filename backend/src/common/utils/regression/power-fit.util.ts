import { PowerFitResult } from './power-fit-result.interface';

/**
 * Fit y = A·xᴮ using linearisation (ln y = ln A + B·ln x).
 * Equivalent to: scipy.optimize.curve_fit with f=lambda x,A,B: A*x**B
 * — but faster because it uses the closed-form log-log solution.
 *
 * ⚠️  All x and y values must be positive.
 */
export function powerFit(x: number[], y: number[]): PowerFitResult {
  const { PowerRegression } = require('ml-regression') as {
    PowerRegression: new (x: number[], y: number[]) => {
      A: number; B: number; r2: number; predict(x: number): number;
    };
  };
  const m = new PowerRegression(x, y);
  return { A: m.A, B: m.B, r2: m.r2, predict: (v) => m.predict(v) };
}
