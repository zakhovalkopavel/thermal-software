/**
 * TRC ideal-gas heat capacity coefficients.
 * Common refs: TRC1994
 *
 * Cp/R = a0 + (a1/T²)·exp(−a2/T) + a3·y² + (a4 − a5/(T − a7)²)·y⁸,  y = (T − a7)/(T + a6) for T > a7, else 0
 */
export type TrcCpEquation = {
  a0: number;
  a1: number;
  a2: number;
  a3: number;
  a4: number;
  a5: number;
  a6: number;
  a7: number;
  /** Integration constant of H/R */
  I: number;
  /** Integration constant of S/R (not used by the Cp method) */
  J: number;
};
