/**
 * Sutherland law coefficients (gas viscosity or thermal conductivity).
 * ref: White3 (Eqs. 1-36, 1-44b)
 *
 * y = y0·(T/T0)^1.5·(T0 + S)/(T + S)
 */
export type SutherlandEquation = {
  /** Value at T0 (μ0 [Pa s] or k0 [W/(m K)]) */
  y0: number;
  /** Reference temperature [K] */
  T0: number;
  /** Sutherland constant [K] */
  S: number;
};
