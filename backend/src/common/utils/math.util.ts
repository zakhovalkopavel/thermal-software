/**
 * General-purpose mathematical utilities.
 */

/**
 * Logarithmic mean of two values.
 *
 * Lm(x1, x2) = (x1 - x2) / ln(x1/x2)
 *
 * Used for wall thickness log-mean radius (cylindrical walls) and
 * log-mean temperature difference in heat exchangers.
 * When |x1 - x2| < 1e-10 the values are considered equal and x1 is returned
 * (avoids ln(1) = 0 division).
 */
export function logMean(x1: number, x2: number): number {
  if (Math.abs(x1 - x2) < 1e-10) return x1;
  return (x1 - x2) / Math.log(x1 / x2);
}
