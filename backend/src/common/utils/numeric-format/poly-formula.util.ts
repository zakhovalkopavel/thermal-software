import { formatSignificant } from './format-significant.util';

/**
 * Build a human-readable polynomial formula string.
 *
 * Example: [1.12, -0.62, 1.09]  →  "y = 1.12 - 0.62·x + 1.09·x²"
 */
export function polyFormula(coeffs: number[]): string {
  const terms = coeffs.map((c, i) => {
    const abs = formatSignificant(Math.abs(c));
    const sign = (i === 0) ? (c < 0 ? '-' : '') : (c < 0 ? ' - ' : ' + ');
    if (i === 0) return `${sign}${abs}`;
    if (i === 1) return `${sign}${abs}·x`;
    return `${sign}${abs}·x^${i}`;
  });
  return `y = ${terms.join('')}`;
}
