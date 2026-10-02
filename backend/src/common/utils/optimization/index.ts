/**
 * Scalar and multi-variable minimisation utilities.
 *
 * Thin, typed wrappers around verified npm packages.
 * All methods mirror their SciPy equivalents by name and semantics.
 *
 * Package loading notes (CommonJS project):
 *   fmin — "type":"module" but build is UMD; loaded via Function wrapper.
 *
 * SciPy mapping:
 *   brent           → scipy.optimize.brent
 *   nelderMead      → scipy.optimize.minimize(method='Nelder-Mead')
 *   conjugateGradient → scipy.optimize.minimize(method='CG')
 */
export type { MinimizeResult } from './minimize-result.interface';
export { brent } from './brent.util';
export { nelderMead } from './nelder-mead.util';
export { conjugateGradient } from './conjugate-gradient.util';
