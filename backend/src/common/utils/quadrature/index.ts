/**
 * Numerical integration — Gauss–Legendre, Simpson, Clenshaw–Curtis and adaptive quadrature.
 *
 * References:
 *   Abramowitz, M.; Stegun, I.A. — Handbook of Mathematical Functions, NBS AMS-55, 1964.
 *   Trefethen, L.N. — Spectral Methods in MATLAB, SIAM, 2000, Ch. 12.
 *   Waldvogel, J.  — Fast Construction of the Fejér and Clenshaw-Curtis
 *                    Quadrature Rules, BIT Numerical Mathematics, 2006.
 */
export type { GaussNodeCount } from './types/gauss-node-count.type';
export type { GaussTable } from './types/gauss-table.type';
export type { AdaptiveIntegrateOptions } from './types/adaptive-integrate-options.type';
export { GAUSS_LEGENDRE_TABLES } from './constants/gauss-legendre-tables.constants';
export { QUADRATURE } from './constants/quadrature.constants';
export { gaussLegendre } from './gauss-legendre.util';
export { gaussLegendre20 } from './gauss-legendre-20.util';
export { simpson } from './simpson.util';
export { clenshawCurtis } from './clenshaw-curtis.util';
export { adaptiveIntegrate } from './adaptive-integrate.util';
