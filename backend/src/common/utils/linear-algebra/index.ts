/**
 * Linear algebra utilities.
 *
 * Thin, typed wrapper around mathjs.
 *
 * SciPy mapping:
 *   luSolve → scipy.linalg.solve / numpy.linalg.solve
 */
export type { SolveLinearResult } from './solve-linear-result.interface';
export { luSolve } from './lu-solve.util';
