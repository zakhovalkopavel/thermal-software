/** Fitted Chebyshev F(C,T) coefficient set for carbon-steel λ. */
export type Kct56ConductivityModel = {
  id: 'kCT56';
  degC: number;
  degT: number;
  /** Carbon domain [wt%], inclusive. */
  C_min: number;
  C_max: number;
  /** Temperature domain [°C], inclusive. */
  T_C_min: number;
  T_C_max: number;
  /**
   * Row-major Chebyshev product coefficients:
   * coef[i * (degT + 1) + j] multiplies T_i(C_n) · T_j(T_n),
   * with C_n, T_n mapped to [-1, 1].
   */
  coef: readonly number[];
};
