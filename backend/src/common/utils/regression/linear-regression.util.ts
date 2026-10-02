import { LinearRegressionResult } from './linear-regression-result.interface';

/**
 * Fit y = slope·x + intercept using ordinary least squares.
 * Equivalent to: scipy.stats.linregress(x, y)  /  numpy.polyfit(x, y, 1)
 */
export function linearRegression(x: number[], y: number[]): LinearRegressionResult {
  const { SimpleLinearRegression } = require('ml-regression') as {
    SimpleLinearRegression: new (x: number[], y: number[]) => {
      slope: number; intercept: number; r2: number; predict(x: number): number;
    };
  };
  const m = new SimpleLinearRegression(x, y);
  return { slope: m.slope, intercept: m.intercept, r2: m.r2, predict: (v) => m.predict(v) };
}
