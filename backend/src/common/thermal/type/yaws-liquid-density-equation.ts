/**
 * Yaws 1999 saturated-liquid density correlation (tables 8-1 / 8-2).
 *
 * ρ = A · B^(-(1 − T/Tc)^n)   with ρ in g/ml
 *
 * Dataset stores SI kg/m³ via k = 1000.
 */
export type YawsLiquidDensityEquation = {
  a: number;
  b: number;
  n: number;
  Tc: number;
};
