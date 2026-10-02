export interface AdaptiveIntegrateOptions {
  /**
   * Override the automatic method selection.
   * - `'gauss'`    — force Gauss–Legendre (best for smooth, non-oscillating)
   * - `'cc'`       — force Clenshaw–Curtis (best for oscillating / Bessel-weighted)
   * - `'auto'`     — detect automatically (default)
   */
  method?: 'gauss' | 'cc' | 'auto';
  /**
   * Number of quadrature nodes.
   * For Gauss–Legendre: must be 8 | 16 | 32 | 64 (default 32).
   * For Clenshaw–Curtis: any even integer (default 64).
   */
  nodes?: number;
}
