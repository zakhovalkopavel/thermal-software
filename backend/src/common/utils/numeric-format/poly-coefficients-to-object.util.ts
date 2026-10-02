/**
 * Convert a polynomial coefficient array [c0, c1, …, cn] into a named object
 * { c0: …, c1: …, …, cn: … }.
 *
 * Coefficients are in ascending degree order (c0 = constant, c1 = linear, …).
 */
export function polyCoefficientsToObject(coeffs: number[]): Record<string, number> {
  return Object.fromEntries(coeffs.map((c, i) => [`c${i}`, c]));
}
