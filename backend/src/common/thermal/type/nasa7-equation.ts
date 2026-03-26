/**
 * NASA 7-coefficient polynomial — one temperature range.
 * ref: NASA2002 (McBride, Zehe, Gordon — NASA TM-2002-211556)
 *
 * Cp/R = a1 + a2·T + a3·T² + a4·T³ + a5·T⁴
 * H/RT = a1 + a2·T/2 + a3·T²/3 + a4·T³/4 + a5·T⁴/5 + a6/T
 * S/R  = a1·ln T + a2·T + a3·T²/2 + a4·T³/3 + a5·T⁴/4 + a7
 */
export type Nasa7Coeffs = {
  a1: number;
  a2: number;
  a3: number;
  a4: number;
  a5: number;
  /** Integration constant — encodes reference enthalpy Hf° at 298 K */
  a6: number;
  /** Integration constant — encodes reference entropy S° at 298 K */
  a7: number;
};

/**
 * NASA 7-coefficient polynomial for a species — two temperature ranges.
 * ref: NASA2002
 *
 * low  range: 200 K – Tswitch
 * high range: Tswitch – 6000 K
 */
export type Nasa7Equation = {
  low:     Nasa7Coeffs;
  high:    Nasa7Coeffs;
  /** Temperature switch between low/high ranges [K], typically 1000 K */
  Tswitch: number;
};

