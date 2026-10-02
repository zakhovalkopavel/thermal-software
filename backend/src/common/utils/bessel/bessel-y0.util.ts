// eslint-disable-next-line @typescript-eslint/no-var-requires
const _y0: (x: number) => number = require('@stdlib/math/base/special/bessely0');

/**
 * Bessel function of the second kind (Neumann function), order 0: Y₀(x).
 * Valid for x > 0.
 */
export function besselY0(x: number): number {
  if (x <= 0) throw new RangeError('besselY0: x must be > 0');
  return _y0(x);
}
