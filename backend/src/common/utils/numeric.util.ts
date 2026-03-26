/**
 * Numerical Methods Utility
 *
 * Thin, typed wrappers around verified npm packages.
 * All methods mirror their SciPy equivalents by name and semantics.
 *
 * Package loading notes (CommonJS project):
 *   brent-zero-generator   — CJS, plain require()
 *   fmin                   — "type":"module" but build is UMD; loaded via Function wrapper
 *   ml-regression          — CJS, plain require()
 *   ml-levenberg-marquardt — CJS, plain require()
 *   mathjs                 — CJS, plain require()
 *
 * SciPy mapping:
 *   brentq              → scipy.optimize.brentq
 *   brent               → scipy.optimize.brent
 *   nelderMead          → scipy.optimize.minimize(method='Nelder-Mead')
 *   conjugateGradient   → scipy.optimize.minimize(method='CG')
 *   linearRegression    → scipy.stats.linregress / numpy.polyfit(deg=1)
 *   polynomialFit       → numpy.polyfit(deg=n)
 *   exponentialFit      → scipy.optimize.curve_fit with a*exp(b*x) model
 *   powerFit            → scipy.optimize.curve_fit with a*x^b model
 *   levenbergMarquardt  → scipy.optimize.curve_fit (arbitrary nonlinear model)
 *   luSolve             → scipy.linalg.solve / numpy.linalg.solve
 *
 * Choosing between ml-regression and levenbergMarquardt:
 *   Use ml-regression  when the model family is standard (linear, polynomial,
 *                      exponential a·eᵇˣ, power a·xᵇ) — faster, closed-form.
 *   Use levenbergMarquardt when the model is an arbitrary nonlinear function
 *                      (e.g. Arrhenius A·exp(B/T), VTF A+B/(T−T₀)) — iterative.
 */

import * as fs from 'fs';

// ─── fmin UMD loader (singleton) ─────────────────────────────────────────────
// fmin@0.0.4 ships "type":"module" in package.json but the actual build/fmin.js
// is a UMD bundle. Dynamic import() fails because Node treats it as ESM.
// Solution: load the UMD source text and execute it via Function() which bypasses
// the module-type check while fully initialising the CJS exports object.

let _fmin: FminExports | null = null;

interface FminExports {
  nelderMead(
    f: (x: number[]) => number,
    x0: number[],
    params?: { maxIterations?: number; tolerance?: number },
  ): { x: number[]; fx: number };

  conjugateGradient(
    f: (x: number[], grad: number[]) => number,
    x0: number[],
    params?: { maxIterations?: number },
  ): { x: number[]; fx: number };

  gradientDescent(
    f: (x: number[], grad: number[]) => number,
    x0: number[],
    params?: { maxIterations?: number; learnRate?: number },
  ): { x: number[]; fx: number };
}

function getFmin(): FminExports {
  if (_fmin) return _fmin;
  // require.resolve('fmin/build/fmin.js') works even though fmin has "type":"module"
  // because we are resolving a sub-path directly, not the package root.
  const fminPath = require.resolve('fmin/build/fmin.js');
  const src = fs.readFileSync(fminPath, 'utf8');
  const mod = { exports: {} as FminExports };
  // eslint-disable-next-line no-new-func
  new Function('module', 'exports', 'require', src)(mod, mod.exports, require);
  _fmin = mod.exports;
  return _fmin;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Root1dResult {
  root: number;
  /** Iterations used */
  iterations?: number;
}

export interface MinimizeResult {
  /** Solution vector */
  x: number[];
  /** Objective value at solution */
  fx: number;
}

export interface CurveFitResult {
  parameterValues: number[];
  parameterError: number[];
  iterations: number;
}

export interface SolveLinearResult {
  /** Solution vector x where A·x = b */
  x: number[];
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

// ─── 1-D root finding ─────────────────────────────────────────────────────────

/**
 * Find a root of f in [a, b] using Brent's method.
 * Equivalent to: scipy.optimize.brentq(f, a, b, xtol=tol)
 *
 * Requirements: f(a) and f(b) must have opposite signs.
 *
 * @param f   Scalar function
 * @param a   Left bracket
 * @param b   Right bracket
 * @param tol Absolute tolerance (default 1e-10)
 */
export function brentq(
  f: (x: number) => number,
  a: number,
  b: number,
  tol = 1e-10,
): Root1dResult {
  const { zero } = require('brent-zero-generator') as {
    zero: (f: (x: number) => number, a: number, b: number, tol: number) => number;
  };
  const root = zero(f, a, b, tol);
  return { root };
}

// ─── 1-D minimisation ─────────────────────────────────────────────────────────

/**
 * Minimise a scalar function of one variable on [a, b] using golden-section search.
 * Equivalent to: scipy.optimize.brent(f, brack=(a, b))
 *
 * Pure implementation — no external package needed for a simple 1-D bracketed minimum.
 *
 * @param f   Scalar function
 * @param a   Left bracket
 * @param b   Right bracket
 * @param tol Absolute tolerance (default 1e-8)
 */
export function brent(
  f: (x: number) => number,
  a: number,
  b: number,
  tol = 1e-8,
): MinimizeResult {
  // Golden-section search (equivalent to scipy.optimize.brent for bounded 1-D)
  const phi = (Math.sqrt(5) - 1) / 2; // 0.6180…
  let lo = a, hi = b;
  let x1 = hi - phi * (hi - lo);
  let x2 = lo + phi * (hi - lo);
  let f1 = f(x1), f2 = f(x2);
  let iters = 0;
  while (Math.abs(hi - lo) > tol && iters++ < 200) {
    if (f1 < f2) { hi = x2; x2 = x1; f2 = f1; x1 = hi - phi * (hi - lo); f1 = f(x1); }
    else         { lo = x1; x1 = x2; f1 = f2; x2 = lo + phi * (hi - lo); f2 = f(x2); }
  }
  const xMin = (lo + hi) / 2;
  return { x: [xMin], fx: f(xMin) };
}

// ─── Multi-variable optimisation (gradient-free) ─────────────────────────────

/**
 * Minimise a scalar function of N variables using the Nelder-Mead simplex algorithm.
 * Equivalent to: scipy.optimize.minimize(f, x0, method='Nelder-Mead')
 *
 * No gradient required. Robust for non-smooth functions.
 *
 * @param f    Objective function f(x) → scalar
 * @param x0   Initial guess vector
 * @param opts { maxIterations?, tolerance? }
 */
export function nelderMead(
  f: (x: number[]) => number,
  x0: number[],
  opts: { maxIterations?: number; tolerance?: number } = {},
): MinimizeResult {
  const result = getFmin().nelderMead(f, x0.slice(), opts);
  return { x: result.x, fx: result.fx };
}

// ─── Multi-variable optimisation (gradient-based) ────────────────────────────

/**
 * Minimise a scalar function of N variables using the Polak-Ribière
 * conjugate-gradient method with Wolfe line search.
 * Equivalent to: scipy.optimize.minimize(f, x0, method='CG')
 *
 * Requires the gradient. Faster than Nelder-Mead when gradient is available.
 *
 * @param f    Function returning scalar AND writing gradient into the second argument:
 *             f(x: number[], grad: number[]): number
 *             The function must mutate grad in-place and return the scalar value.
 * @param x0   Initial guess vector
 * @param opts { maxIterations? }
 */
export function conjugateGradient(
  f: (x: number[], grad: number[]) => number,
  x0: number[],
  opts: { maxIterations?: number } = {},
): MinimizeResult {
  const result = getFmin().conjugateGradient(f, x0.slice(), opts);
  return { x: result.x, fx: result.fx };
}

// ─── Standard regression models (ml-regression) ──────────────────────────────

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

// ─── Nonlinear least-squares curve fit ───────────────────────────────────────

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

// ─── Gaussian quadrature ─────────────────────────────────────────────────────
// Implementation and coefficient tables live in gauss-legendre.util.ts (SRP).
// Re-exported here so existing imports from numeric.util continue to work.
export { gaussLegendre20, GL20_NODES, GL20_WEIGHTS } from './gauss-legendre.util';

// ─── Linear system solver ─────────────────────────────────────────────────────

/**
 * Solve a dense linear system A·x = b using LU decomposition.
 * Equivalent to: scipy.linalg.solve(A, b)  /  numpy.linalg.solve(A, b)
 *
 * @param A  n×n coefficient matrix (row-major array of arrays)
 * @param b  Right-hand side vector of length n
 */
export function luSolve(A: number[][], b: number[]): SolveLinearResult {
  const math = require('mathjs') as {
    lusolve: (A: number[][], b: number[]) => number[][];
  };
  const sol = math.lusolve(A, b); // returns [[x0],[x1],…]
  return { x: sol.map((row) => row[0]) };
}
