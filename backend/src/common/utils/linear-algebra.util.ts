/**
 * Linear algebra utilities.
 *
 * Thin, typed wrapper around mathjs.
 *
 * SciPy mapping:
 *   luSolve → scipy.linalg.solve / numpy.linalg.solve
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SolveLinearResult {
  /** Solution vector x where A·x = b */
  x: number[];
}

// ─── Implementation ───────────────────────────────────────────────────────────

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
