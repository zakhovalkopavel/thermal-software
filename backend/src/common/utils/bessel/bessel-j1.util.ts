// eslint-disable-next-line @typescript-eslint/no-var-requires
const _j1: (x: number) => number = require('@stdlib/math/base/special/besselj1');

/** Bessel function of the first kind, order 1: J₁(x). Odd: J₁(−x) = −J₁(x). */
export function besselJ1(x: number): number {
  return _j1(x);
}
