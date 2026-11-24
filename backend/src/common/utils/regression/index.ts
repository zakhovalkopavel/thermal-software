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
export type { CurveFitResult } from './types/curve-fit-result.type';
export type { LinearRegressionResult } from './types/linear-regression-result.type';
export type { PolynomialFitResult } from './types/polynomial-fit-result.type';
export type { ExponentialFitResult } from './types/exponential-fit-result.type';
export type { PowerFitResult } from './types/power-fit-result.type';
export { linearRegression } from './linear-regression.util';
export { polynomialFit } from './polynomial-fit.util';
export { exponentialFit } from './exponential-fit.util';
export { powerFit } from './power-fit.util';
export { levenbergMarquardt } from './levenberg-marquardt.util';
