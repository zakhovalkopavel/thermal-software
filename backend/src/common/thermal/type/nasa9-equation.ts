/**
 * NASA 9-coefficient polynomial — one temperature range.
 * ref: NASA/TP-2002-211556 (McBride, Gordon, Reno — NASA TP-1993-003606 original;
 *      extended format: McBride & Gordon 1996, "Computer Program for Calculation
 *      of Complex Chemical Equilibrium Compositions and Applications", NASA RP-1311)
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

/**
 * NASA 9-coefficient polynomial for a species — variable number of temperature ranges.
 * ref: NASA RP-1311 (McBride & Gordon 1996)
 *
 * NASA-9 supports arbitrary range splits; common databases use 2–3 ranges, e.g.:
 *   200–1000 K / 1000–6000 K / 6000–20000 K
 *
 * Each range is stored as { Tmin, Tmax, coeffs }.
 */
export type Nasa9Range = {
  /** Lower bound of this range [K] */
  Tmin: number;
  /** Upper bound of this range [K] */
  Tmax: number;
  coeffs: Nasa9Coeffs;
};

/**
 * Full NASA-9 entry for a species — ordered list of temperature ranges.
 * Ranges must be contiguous and non-overlapping (Tmax[i] === Tmin[i+1]).
 */
export type Nasa9Equation = {
  ranges: Nasa9Range[];
};

