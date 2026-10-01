import type { GaussNodeCount } from '../../../common/utils/gauss-legendre.constants';
import type { AverageOptions } from '../type/average-options.type';

/** Default number of Fourier series terms (BC I, BC III solid bodies) */
export const SERIES_TERMS_DEFAULT = 100;

/** Default number of series terms for the BC III hollow cylinder */
export const HOLLOW_SERIES_TERMS_DEFAULT = 50;

/** Default Simpson intervals for arbitrary-profile coefficient integration */
export const SIMPSON_INTERVALS_DEFAULT = 128;

/** Root tolerance of BC III eigenvalues (plate, cylinder, sphere) */
export const EIGENVALUE_TOL_BC3 = 1e-12;

/** Root tolerance of BC III hollow-cylinder eigenvalues */
export const EIGENVALUE_TOL_HOLLOW_BC3 = 1e-10;

export const GAUSS_NODES_DEFAULT: GaussNodeCount = 32;

export const AVERAGE_MODE_DEFAULT: AverageOptions['mode'] = 'series';
