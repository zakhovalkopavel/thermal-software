/**
 * Numeric response formatters.
 *
 * Builds human-readable formula strings and reshapes raw coefficient arrays
 * into named-key objects for API responses.
 * These are pure presentation helpers — no maths, no side effects.
 */
export { polyCoefficientsToObject } from './poly-coefficients-to-object.util';
export { polyFormula } from './poly-formula.util';
export { linearFormula } from './linear-formula.util';
export { exponentialFormula } from './exponential-formula.util';
export { powerFormula } from './power-formula.util';
export { lmFormula } from './lm-formula.util';
