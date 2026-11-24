/**
 * NASA 9-coefficient polynomial — one temperature range.
 * ref: NASA9 (Burcat & Ruscic ANL-05/20; format of McBride & Gordon 1996, NASA RP-1311)
 *
 * Cp/R = a1·T⁻² + a2·T⁻¹ + a3 + a4·T + a5·T² + a6·T³ + a7·T⁴
 * H/RT = -a1·T⁻² + a2·ln(T)/T + a3 + a4·T/2 + a5·T²/3 + a6·T³/4 + a7·T⁴/5 + a8/T
 * S/R  = -a1·T⁻²/2 - a2·T⁻¹ + a3·ln(T) + a4·T + a5·T²/2 + a6·T³/3 + a7·T⁴/4 + a9
 */
export type Nasa9Coeffs = {
  a1: number;
  a2: number;
  a3: number;
  a4: number;
  a5: number;
  a6: number;
  a7: number;
  /** Integration constant — encodes reference enthalpy Hf° */
  a8: number;
  /** Integration constant — encodes reference entropy S° */
  a9: number;
};
