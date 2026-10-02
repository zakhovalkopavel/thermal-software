// eslint-disable-next-line @typescript-eslint/no-var-requires
const _y1: (x: number) => number = require('@stdlib/math/base/special/bessely1');

/**
 * Bessel function of the second kind (Neumann function), order 1: Y₁(x).
 * Valid for x > 0.
 */
export function besselY1(x: number): number {
  if (x <= 0) throw new RangeError('besselY1: x must be > 0');
  return _y1(x);
}
