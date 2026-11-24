/**
 * λ(T) polynomial coefficients.
 *
 * When `tempUnit` is 'K', T_K is used directly.
 * When `tempUnit` is 'C', T_C = kelvinToCelsius(T_K) is used.
 *
 * λ = a + b·T + c·T² + d·T³   [W/(m·K)]
 */
export type MetalLambdaCoefficients = {
  a: number;
  b: number;
  c?: number;
  d?: number;
  /** Temperature unit for the polynomial argument. Default: 'C' */
  tempUnit?: 'K' | 'C';
};
