/**
 * Curve-fitting and regression utilities.
 *
 * Thin, typed wrappers around verified npm packages.
 * All methods mirror their SciPy/NumPy equivalents by name and semantics.
 *
 * Package loading notes (CommonJS project):
 *   ml-regression          — CJS, plain require()
 *   ml-levenberg-marquardt — CJS, plain require()
 *
 * SciPy mapping:
 *   linearRegression    → scipy.stats.linregress / numpy.polyfit(deg=1)
 *   polynomialFit       → numpy.polyfit(deg=n)
 *   exponentialFit      → scipy.optimize.curve_fit with a*exp(b*x) model
 *   powerFit            → scipy.optimize.curve_fit with a*x^b model
 *   levenbergMarquardt  → scipy.optimize.curve_fit (arbitrary nonlinear model)
 *
 * Choosing between ml-regression and levenbergMarquardt:
 *   Use ml-regression  when the model family is standard (linear, polynomial,
 *                      exponential a·eᵇˣ, power a·xᵇ) — faster, closed-form.
 *   Use levenbergMarquardt when the model is an arbitrary nonlinear function
 *                      (e.g. Arrhenius A·exp(B/T), VTF A+B/(T−T₀)) — iterative.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CurveFitResult {
  parameterValues: number[];
  parameterError: number[];
  iterations: number;
}

export interface LinearRegressionResult {
  /** Slope */
  slope: number;
  /** Intercept */
  intercept: number;
  /** R² coefficient of determination */
  r2: number;
  predict(x: number): number;
}

export interface PolynomialFitResult {
  /** Coefficients [c0, c1, …, cn] where y = c0 + c1·x + c2·x² + … */
  coefficients: number[];
  /** R² coefficient of determination */
  r2: number;
  predict(x: number): number;
}

export interface ExponentialFitResult {
  /** Pre-exponential factor A in y = A·eᴮˣ */
  A: number;
  /** Exponential rate B in y = A·eᴮˣ */
  B: number;
  /** R² coefficient of determination */
  r2: number;
  predict(x: number): number;
}

export interface PowerFitResult {
  /** Coefficient A in y = A·xᴮ */
  A: number;
  /** Exponent B in y = A·xᴮ */
  B: number;
  /** R² coefficient of determination */
  r2: number;
  predict(x: number): number;
}

// ─── Implementation ───────────────────────────────────────────────────────────

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
