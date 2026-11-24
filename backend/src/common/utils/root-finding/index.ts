/**
 * 1-D root-finding utilities.
 *
 * Thin, typed wrappers around verified npm packages.
 * All methods mirror their SciPy equivalents by name and semantics.
 *
 * SciPy mapping:
 *   brentq   → scipy.optimize.brentq
 *   newton   → scipy.optimize.newton (polish step only)
 */
export type { Root1dResult } from './types/root-1d-result.type';
export { brentq } from './brentq.util';
export { newtonPolish } from './newton-polish.util';
