import { formatSignificant } from './format-significant.util';

/**
 * Build a human-readable power-law formula string.
 *
 * Example: A=2.0, B=1.5  →  "y = 2.0·x^1.5"
 */
export function powerFormula(A: number, B: number): string {
  return `y = ${formatSignificant(A)}·x^${formatSignificant(B)}`;
}
