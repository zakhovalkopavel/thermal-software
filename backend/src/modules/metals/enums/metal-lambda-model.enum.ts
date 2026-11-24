/**
 * λ evaluation path for GET /metals/thermal-properties.
 * `table` = poly override or ASM cubic spline (default).
 * `kCT56` = Chebyshev F(C,T) carbon-steel closed-form alternative.
 */
export enum MetalLambdaModel {
  TABLE = 'table',
  KCT56 = 'kCT56',
}
