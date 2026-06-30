import type { GaussNodes } from './gauss-nodes.type';

export type AverageOptions = {
  /**
   * series — exact Bn analytical summation (default for 1D / product-rule bodies).
   * gauss  — Gauss-Legendre quadrature (mandatory for hollow cylinder / complex bodies).
   * auto   — series where available, gauss otherwise.
   */
  mode: 'series' | 'gauss' | 'auto';
  gaussNodes?: GaussNodes;  // default: 32
  simpsonNodes?: number;    // for arbitrary-profile coefficient integration; default: 128
};
