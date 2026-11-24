/**
 * Natural cubic spline evaluator over knots (x[i], y[i]).
 * Equivalent role to: scipy.interpolate.CubicSpline(x, y, bc_type='natural')
 */
export type CubicSplineResult = {
  /** Evaluate S(x). Throws if x is outside [x[0], x[n-1]]. */
  evaluate: (x: number) => number;
  /** Knot domain. */
  xMin: number;
  xMax: number;
};
