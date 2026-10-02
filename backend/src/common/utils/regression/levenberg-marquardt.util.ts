import { CurveFitResult } from './curve-fit-result.interface';

/**
 * Fit a parametric model to data using the Levenberg-Marquardt algorithm.
 * Equivalent to: scipy.optimize.curve_fit  /  scipy.optimize.least_squares
 *
 * Well-suited for overdetermined nonlinear systems (more data points than parameters).
 * Also a practical substitute for scipy.optimize.root(method='hybr') on smooth
 * residual systems when slightly overdetermined.
 *
 * @param xData         Array of x values
 * @param yData         Array of observed y values
 * @param model         Factory: (params: number[]) => (x: number) => number
 *                      e.g. ([A,B]) => T => A * Math.exp(B / T)
 * @param initialValues Initial parameter guess
 * @param opts          { maxIterations?, damping?, gradientDifference? }
 */
export function levenbergMarquardt(
  xData: number[],
  yData: number[],
  model: (params: number[]) => (x: number) => number,
  initialValues: number[],
  opts: { maxIterations?: number; damping?: number; gradientDifference?: number } = {},
): CurveFitResult {
  const { levenbergMarquardt: lm } = require('ml-levenberg-marquardt') as {
    levenbergMarquardt: (
      data: { x: number[]; y: number[] },
      paramFn: (params: number[]) => (x: number) => number,
      opts: object,
    ) => { parameterValues: number[]; parameterError: number[]; iterations: number };
  };
  const result = lm(
    { x: xData, y: yData },
    model,
    { initialValues, maxIterations: 200, ...opts },
  );
  return {
    parameterValues: result.parameterValues,
    parameterError:  result.parameterError,
    iterations:      result.iterations,
  };
}
