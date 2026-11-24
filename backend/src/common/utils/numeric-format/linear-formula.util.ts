import { formatSignificant } from './format-significant.util';

/**
 * Build a human-readable linear formula string.
 *
 * Example: slope=2.04, intercept=-0.1  →  "y = 2.04·x - 0.1"
 */
export function linearFormula(slope: number, intercept: number): string {
  const s = `${slope < 0 ? '-' : ''}${formatSignificant(Math.abs(slope))}`;
  const bSign = intercept < 0 ? ' - ' : ' + ';
  const b = formatSignificant(Math.abs(intercept));
  return `y = ${s}·x${bSign}${b}`;
}
