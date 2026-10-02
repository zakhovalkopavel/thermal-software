// eslint-disable-next-line @typescript-eslint/no-var-requires
const _j0: (x: number) => number = require('@stdlib/math/base/special/besselj0');

/** Bessel function of the first kind, order 0: J₀(x). */
export function besselJ0(x: number): number {
  return _j0(x);
}
