import { formatSignificant } from './format-significant.util';

/**
 * Build a human-readable exponential formula string.
 *
 * Example: A=1.5, B=0.3  →  "y = 1.5·e^(0.3·x)"
 */
export function exponentialFormula(A: number, B: number): string {
  return `y = ${formatSignificant(A)}·e^(${formatSignificant(B)}·x)`;
}
