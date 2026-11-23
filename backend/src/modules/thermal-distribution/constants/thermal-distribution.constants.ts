import type { GaussNodeCount } from '../../../common/utils/quadrature';
import type { AverageOptions } from '../type/average-options.type';

/** Defaults and tolerances for thermal-distribution series / quadrature. */
export const THERMAL_DISTRIBUTION_CONSTANTS: {
  SERIES_TERMS_DEFAULT: number;
  HOLLOW_SERIES_TERMS_DEFAULT: number;
  SIMPSON_INTERVALS_DEFAULT: number;
  EIGENVALUE_TOL_BC3: number;
  EIGENVALUE_TOL_HOLLOW_BC3: number;
  GAUSS_NODES_DEFAULT: GaussNodeCount;
  AVERAGE_MODE_DEFAULT: AverageOptions['mode'];
} = {
  SERIES_TERMS_DEFAULT: 100,
  HOLLOW_SERIES_TERMS_DEFAULT: 50,
  SIMPSON_INTERVALS_DEFAULT: 128,
  EIGENVALUE_TOL_BC3: 1e-12,
  EIGENVALUE_TOL_HOLLOW_BC3: 1e-10,
  GAUSS_NODES_DEFAULT: 32,
  AVERAGE_MODE_DEFAULT: 'series',
};
