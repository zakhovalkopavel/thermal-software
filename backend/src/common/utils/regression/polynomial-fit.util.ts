import { PolynomialFitResult } from './polynomial-fit-result.interface';

/**
 * Fit a polynomial y = c0 + c1·x + … + cn·xⁿ by least squares (regression).
 * Equivalent to: numpy.polyfit(x, y, degree)
 *
 * Coefficients are returned in ascending degree order [c0, c1, …, cn]
 * (opposite to numpy.polyfit which returns descending order).
 *
 * @param degree  Polynomial degree (1 = linear, 2 = quadratic, etc.)
 */
export function polynomialFit(x: number[], y: number[], degree: number): PolynomialFitResult {
  const { PolynomialRegression } = require('ml-regression') as {
    PolynomialRegression: new (x: number[], y: number[], degree: number) => {
      coefficients: number[]; r2: number; predict(x: number): number;
    };
  };
  const m = new PolynomialRegression(x, y, degree);
  return { coefficients: m.coefficients, r2: m.r2, predict: (v) => m.predict(v) };
}
