/**
 * Power-law coefficients (gas viscosity or thermal conductivity).
 * ref: White3 (Eqs. 1-35, 1-44a)
 *
 * y = y0·(T/T0)^n
 */
export type PowerLawEquation = {
  /** Value at T0 (μ0 [Pa s] or k0 [W/(m K)]) */
  y0: number;
  /** Reference temperature [K] */
  T0: number;
  n: number;
};
