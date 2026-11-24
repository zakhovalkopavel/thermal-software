/**
 * Linear algebra utilities.
 *
 * Thin, typed wrapper around mathjs.
 *
 * SciPy mapping:
 *   luSolve → scipy.linalg.solve / numpy.linalg.solve
 */
export type { SolveLinearResult } from './types/solve-linear-result.type';
export { luSolve } from './lu-solve.util';
