/**
 * Zabransky quasi-polynomial liquid heat capacity coefficients.
 * ref: Zabransky1996
 *
 * Cp/R = a1·ln(1 − Tr) + a2/(1 − Tr) + a3 + a4·Tr + a5·Tr² + a6·Tr³,  Tr = T/Tc
 */
export type ZabranskyQuasiPolynomialEquation = {
  /** Critical temperature [K] */
  Tc: number;
  a1: number;
  a2: number;
  a3: number;
  a4: number;
  a5: number;
  a6: number;
};
